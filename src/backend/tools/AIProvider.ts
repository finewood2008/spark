/**
 * AIProvider - AI 提供商封装
 * 
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 QeeClawBridge 调用平台统一模型路由
 *   2. 直连模式（fallback）— 直接调用 OpenAI 兼容 API
 */

import { QeeClawBridge } from '../qeeclaw/qeeclaw-client';

// Gemini Proxy — temporary OpenAI-compatible relay (no key required)
const GEMINI_PROXY_URL = 'https://gemini-proxy.finewood2008.workers.dev/v1';
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Choice {
  message: {
    content: string;
  };
}

interface APIResponse {
  choices: Choice[];
}

export class AIProvider {
  private config: AIConfig;
  private defaultModel: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.defaultModel = config.defaultModel;
  }

  // ─── 平台优先的便捷方法 ──────────────────────

  /**
   * 尝试通过 QeeClaw 平台调用模型，失败则 fallback 到直连
   */
  async chat(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    // 尝试平台路由
    try {
      const bridge = QeeClawBridge.get();
      if (bridge.online) {
        const prompt = messages.map(m => {
          if (m.role === 'system') return `[System] ${m.content}`;
          if (m.role === 'user') return `[User] ${m.content}`;
          return `[Assistant] ${m.content}`;
        }).join('\n\n');
        
        // Use the official SDK model instead of the bridge wrapper
        const result = await bridge.sdk.models.invoke({
            prompt: prompt,
            messages: messages as any, // Pass native array just in case
            route: options.model || "general-llm", // QeeClaw uses 'route' concept
            stream: false
        });
        return result.text;
      }
    } catch (e) {
      console.warn("QeeClaw SDK invoke failed, falling back to direct:", e);
    }

    return this.chatDirect(messages, options);
  }

  /**
   * 直连 Gemini Proxy（fallback 路径）
   * Gemini Proxy fallback — routes through proxy when SDK is unavailable
   */
  async chatDirect(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const model = options.model || GEMINI_DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;

    // Gemini Proxy fallback (Using Google Gemini API format directly since proxy passes through)
    // Convert OpenAI messages to Gemini contents
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));
    
    // Add system instruction if present
    const systemMsg = messages.find(m => m.role === 'system');
    let systemInstruction = undefined;
    if (systemMsg) {
        systemInstruction = { parts: [{ text: systemMsg.content }] };
        // Remove system message from contents
        const sysIndex = contents.findIndex(c => c.parts[0].text === systemMsg.content && c.role === 'user');
        if (sysIndex !== -1) contents.splice(sysIndex, 1);
    }

    const response = await fetch(`${GEMINI_PROXY_URL}/models/${model}:generateContent?key=${process.env.FALLBACK_API_KEY || 'dummy'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && { systemInstruction }),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * 流式聊天补全 — SDK 优先，Gemini Proxy 兜底
   */
  async *chatStream(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string> {
    // 1️⃣ 尝试平台 SDK（目前 SDK 不支持流式，预留接口）
    try {
      const bridge = QeeClawBridge.get();
      if (bridge.online) {
        const prompt = messages.map(m => {
          if (m.role === 'system') return `[System] ${m.content}`;
          if (m.role === 'user') return `[User] ${m.content}`;
          return `[Assistant] ${m.content}`;
        }).join('\n\n');
        const result = await bridge.invokeModel(prompt, options.model);
        yield result.text;
        return;
      }
    } catch {
      // bridge 不可用，走 Gemini Proxy fallback
    }

    // Gemini Proxy streaming fallback
    const model = options.model || GEMINI_DEFAULT_MODEL;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;

    const response = await fetch(`${GEMINI_PROXY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }

  /**
   * 图像理解（Vision）— SDK 优先，Gemini Proxy 兜底
   */
  async vision(
    imageUrl: string,
    prompt: string
  ): Promise<string> {
    // 1️⃣ 尝试平台 SDK
    try {
      const bridge = QeeClawBridge.get();
      if (bridge.online) {
        const visionPrompt = `[Vision Task]\nImage: ${imageUrl}\n\n${prompt}`;
        const result = await bridge.invokeModel(visionPrompt);
        return result.text;
      }
    } catch {
      // bridge 不可用，走 Gemini Proxy fallback
    }

    // Gemini Proxy vision fallback
    const response = await fetch(`${GEMINI_PROXY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy',
      },
      body: JSON.stringify({
        model: GEMINI_DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vision API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * 文本嵌入 — SDK 优先，Gemini Proxy 兜底
   */
  async embed(texts: string[]): Promise<number[][]> {
    // 1️⃣ 尝试平台 SDK
    try {
      const bridge = QeeClawBridge.get();
      if (bridge.online && typeof (bridge as any).embed === 'function') {
        return await (bridge as any).embed(texts);
      }
    } catch {
      // bridge 不可用，走 Gemini Proxy fallback
    }

    // Gemini Proxy embeddings fallback
    const response = await fetch(`${GEMINI_PROXY_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy',
      },
      body: JSON.stringify({
        model: 'text-embedding-004',
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data.map((item) => item.embedding);
  }

  getCurrentModel(): string {
    return this.defaultModel;
  }

  setModel(model: string): void {
    this.defaultModel = model;
  }
}

// 创建默认实例
export function createAIProvider(config: AIConfig): AIProvider {
  return new AIProvider(config);
}
