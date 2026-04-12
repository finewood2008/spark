"use strict";
/**
 * AIProvider - AI 提供商封装
 *
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 QeeClawBridge 调用平台统一模型路由
 *   2. 直连模式（fallback）— 直接调用 OpenAI 兼容 API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = void 0;
exports.createAIProvider = createAIProvider;
const qeeclaw_client_1 = require("../qeeclaw/qeeclaw-client");
class AIProvider {
    constructor(config) {
        this.config = config;
        this.defaultModel = config.defaultModel;
    }
    // ─── 平台优先的便捷方法 ──────────────────────
    /**
     * 尝试通过 QeeClaw 平台调用模型，失败则 fallback 到直连
     */
    async chat(messages, options = {}) {
        // 尝试平台路由
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            if (bridge.online) {
                // 将 messages 拼成单个 prompt 给 SDK invoke
                const prompt = messages.map(m => {
                    if (m.role === 'system')
                        return `[System] ${m.content}`;
                    if (m.role === 'user')
                        return `[User] ${m.content}`;
                    return `[Assistant] ${m.content}`;
                }).join('\n\n');
                const result = await bridge.invokeModel(prompt, options.model);
                return result.text;
            }
        }
        catch {
            // bridge 未初始化或平台不可达，走 fallback
        }
        return this.chatDirect(messages, options);
    }
    /**
     * 直连 OpenAI 兼容 API（fallback 路径）
     */
    async chatDirect(messages, options = {}) {
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
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    /**
     * 流式聊天补全（仅直连模式，平台暂不支持流式）
     */
    async *chatStream(messages, options = {}) {
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
            if (done)
                break;
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
                    }
                    catch {
                        // 忽略解析错误
                    }
                }
            }
        }
    }
    /**
     * 图像理解（Vision）
     */
    async vision(imageUrl, prompt) {
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
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    /**
     * 文本嵌入
     */
    async embed(texts) {
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
        const data = await response.json();
        return data.data.map((item) => item.embedding);
    }
    getCurrentModel() {
        return this.defaultModel;
    }
    setModel(model) {
        this.defaultModel = model;
    }
}
exports.AIProvider = AIProvider;
// 创建默认实例
function createAIProvider(config) {
    return new AIProvider(config);
}
