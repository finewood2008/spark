"use strict";
/**
 * AIProvider - AI 提供商封装
 *
 * 统一封装 vveai API，支持 Claude/GPT/Gemini
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = void 0;
exports.createAIProvider = createAIProvider;
class AIProvider {
    constructor(config) {
        this.config = config;
        this.defaultModel = config.defaultModel;
    }
    /**
     * 聊天补全
     */
    async chat(messages, options = {}) {
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
     * 流式聊天补全
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
    /**
     * 获取当前模型
     */
    getCurrentModel() {
        return this.defaultModel;
    }
    /**
     * 切换模型
     */
    setModel(model) {
        this.defaultModel = model;
    }
}
exports.AIProvider = AIProvider;
// 创建默认实例
function createAIProvider(config) {
    return new AIProvider(config);
}
