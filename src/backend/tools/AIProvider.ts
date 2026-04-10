/**
 * AIProvider - AI 提供商封装
 * 
 * 统一封装 vveai API，支持 Claude/GPT/Gemini
 */

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

  /**
   * 聊天补全
   */
  async chat(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as APIResponse;
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 流式聊天补全
   */
  async *chatStream(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 4096;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
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
   * 图像理解（Vision）
   */
  async vision(
    imageUrl: string,
    prompt: string
  ): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.defaultModel,
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

    const data = await response.json() as APIResponse;
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 文本嵌入
   */
  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
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

  /**
   * 获取当前模型
   */
  getCurrentModel(): string {
    return this.defaultModel;
  }

  /**
   * 切换模型
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }
}

// 创建默认实例
export function createAIProvider(config: AIConfig): AIProvider {
  return new AIProvider(config);
}
