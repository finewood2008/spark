/**
 * IntentParser - 意图解析器
 * 
 * 将用户自然语言解析为结构化意图，同时充当防护门，拒绝非营销和品牌相关的闲聊。
 */

import { AIProvider } from '../tools/AIProvider';

export enum Intent {
  CREATE_CONTENT = 'create_content',
  BUILD_KNOWLEDGE = 'build_knowledge',
  MANAGE_VI = 'manage_vi',
  PUBLISH_CONTENT = 'publish_content',
  QUERY_KNOWLEDGE = 'query_knowledge',
  REJECT_CHAT = 'reject_chat', // 拒绝闲聊
}

export interface IntentResult {
  intent: Intent;
  confidence: number;
  params: Record<string, unknown>;
  message?: string;
}

export class IntentParser {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  async parse(message: string): Promise<IntentResult> {
    const ruleResult = this.ruleMatch(message);
    if (ruleResult && ruleResult.confidence > 0.8) return ruleResult;
    return this.aiParse(message);
  }

  private ruleMatch(message: string): IntentResult | null {
    const lower = message.toLowerCase();

    // 创建内容
    if (/写|生成|创作|帮我发|发布|起草/.test(lower)) {
      return { intent: Intent.CREATE_CONTENT, confidence: 0.85, params: { topic: this.extractTopic(message), platform: this.detectPlatform(message) || 'wechat' } };
    }
    // 知识库
    if (/添加|上传|录入|品牌档案|建立品牌|资料库/.test(lower)) {
      return { intent: Intent.BUILD_KNOWLEDGE, confidence: 0.85, params: { source: 'user_input', data: message } };
    }
    // VI
    if (/vi|视觉|logo|配色|品牌设计|排版规范/.test(lower)) {
      return { intent: Intent.MANAGE_VI, confidence: 0.9, params: { action: 'query' } };
    }

    // 简单拦截问候语
    if (lower === 'hi' || lower === 'hello' || lower === '你好' || lower === '在吗') {
        return { 
            intent: Intent.REJECT_CHAT, 
            confidence: 1.0, 
            params: {}, 
            message: '你好！我是 Spark 品牌营销专家。你可以让我帮你“建立品牌知识库”，或者直接说“帮我为XX写一篇小红书”。'
        };
    }

    return null;
  }

  private async aiParse(message: string): Promise<IntentResult> {
    const prompt = `
你是一个意图分类器。用户的消息："${message}"
注意：本系统是一个严格的企业品牌新媒体营销工具。拒绝回答天气、编程指导、生活琐事等无关内容。

请分析用户意图，返回严格的 JSON 格式：
{
  "intent": "create_content|build_knowledge|manage_vi|publish_content|query_knowledge|reject_chat",
  "params": {
    "topic": "如果是要创建内容，提取主题",
    "platform": "如果提到了平台(如微信,小红书,Twitter等)，提取平台名",
    "query": "如果是查询，提取查询内容"
  },
  "message": "如果是 reject_chat，提供一句礼貌的拒绝语并引导用户使用营销功能。其他 intent 可为空。"
}
只返回 JSON，不要其他内容。
`;

    try {
      const response = await this.aiProvider.chat([{ role: 'user', content: prompt }]);
      const parsed = JSON.parse(response.trim());
      return {
        intent: parsed.intent as Intent,
        confidence: 0.8,
        params: parsed.params || {},
        message: parsed.message
      };
    } catch {
      return { intent: Intent.REJECT_CHAT, confidence: 0.5, params: {}, message: "抱歉，我目前专注于品牌营销与内容生成，没有理解你的意图。请告诉我是否需要建立品牌档案或生成文案。" };
    }
  }

  private detectPlatform(message: string): string | null {
    const lower = message.toLowerCase();
    const platforms: Record<string, string[]> = {
      wechat: ['微信', '公众号', 'wechat'], xiaohongshu: ['小红书', '小红', 'xhs'], douyin: ['抖音', 'tiktok'],
      weibo: ['微博', 'weibo'], zhihu: ['知乎', 'zhihu'], bilibili: ['b站', 'bilibili'],
      twitter: ['twitter', '推特', ' x '], instagram: ['instagram', 'ins', 'ig'], linkedin: ['领英', 'linkedin']
    };
    for (const [name, keywords] of Object.entries(platforms)) {
      if (keywords.some(k => lower.includes(k))) return name;
    }
    return null;
  }

  private extractTopic(message: string): string {
    return message.replace(/帮我|生成|写|创作|关于|的|文章|内容|小红书|微信|抖音|推特/g, '').trim();
  }
}