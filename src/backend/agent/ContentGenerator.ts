/**
 * ContentGenerator - 内容生成器
 * 
 * 根据品牌知识和用户需求，生成符合品牌调性的内容 (支持全球化多平台)
 */

import { AIProvider } from '../tools/AIProvider';
import { BrandMemory } from './MemorySystem';
import { SearchResult } from './RAGEngine';
import { BrandVI } from './VIManager';

export type Platform = 'wechat' | 'xiaohongshu' | 'douyin' | 'weibo' | 'zhihu' | 'bilibili' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok';
export type ContentType = 'article' | 'short_post' | 'video_script' | 'product_desc';

export interface GenerateOptions {
  topic: string;
  platform: Platform;
  style?: string;
  requirements?: string;
  brandMemory?: BrandMemory;
  searchResults?: SearchResult[];
  vi?: BrandVI;
  length?: 'short' | 'medium' | 'long';
}

export interface GeneratedContent {
  id: string;
  platform: Platform;
  type: ContentType;
  title: string;
  body: string;
  hashtags?: string[];
  coverImage?: string;
  suggestedTime?: string;
  score: number;
}

interface PlatformConfig {
  maxLength: number;
  minLength: number;
  style: string[];
  specialChars: boolean;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  // 国内平台
  wechat: { maxLength: 2000, minLength: 500, style: ['正式', '深度', '专业'], specialChars: false },
  xiaohongshu: { maxLength: 1000, minLength: 100, style: ['种草', '生活化', '真实感', 'emoji'], specialChars: true },
  douyin: { maxLength: 150, minLength: 30, style: ['口语化', '节奏快', '吸引眼球'], specialChars: true },
  weibo: { maxLength: 140, minLength: 20, style: ['简短', '话题感', '可读性强'], specialChars: true },
  zhihu: { maxLength: 5000, minLength: 500, style: ['专业', '深度', '有见地', '引用数据'], specialChars: false },
  bilibili: { maxLength: 2000, minLength: 300, style: ['年轻化', '有趣', '弹幕友好'], specialChars: true },
  // 海外平台
  twitter: { maxLength: 280, minLength: 10, style: ['简练', '直接', '话题互动'], specialChars: true },
  instagram: { maxLength: 2200, minLength: 50, style: ['视觉导向', '生活方式', '多标签', 'emoji'], specialChars: true },
  linkedin: { maxLength: 3000, minLength: 200, style: ['职场', '专业', '商业洞察', 'B2B'], specialChars: false },
  tiktok: { maxLength: 150, minLength: 20, style: ['网感', '病毒传播', '口语化'], specialChars: true },
};

export class ContentGenerator {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  async generate(options: GenerateOptions): Promise<GeneratedContent> {
    const { topic, platform, style, requirements, brandMemory, searchResults, vi, length } = options;
    const config = PLATFORM_CONFIGS[platform];
    const prompt = this.buildPrompt({ topic, platform, config, style, requirements, brandMemory, searchResults, vi, length });

    const response = await this.aiProvider.chat([
      { role: 'system', content: '你是 Spark，一个顶尖的企业数字营销新媒体专家。你精通全球各主流社交媒体的算法和用户偏好，擅长将品牌知识库转化为高转化的营销文案。' },
      { role: 'user', content: prompt },
    ]);

    return this.parseGeneratedContent(response, platform, topic);
  }

  async generateVariations(options: GenerateOptions, count: number = 3): Promise<GeneratedContent[]> {
    const results: GeneratedContent[] = [];
    for (let i = 0; i < count; i++) {
      const content = await this.generate({ ...options, style: options.style || `${i + 1}` });
      results.push(content);
    }
    return results;
  }

  private buildPrompt(params: {
    topic: string; platform: Platform; config: PlatformConfig; style?: string;
    requirements?: string; brandMemory?: BrandMemory; searchResults?: SearchResult[];
    vi?: BrandVI; length?: 'short' | 'medium' | 'long';
  }): string {
    const { topic, platform, config, style, requirements, brandMemory, searchResults, vi, length } = params;

    const platformNames: Record<Platform, string> = {
      wechat: '微信公众号', xiaohongshu: '小红书', douyin: '抖音', weibo: '微博', zhihu: '知乎', bilibili: 'B站',
      twitter: 'Twitter/X', instagram: 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok'
    };

    const lengthInstructions = {
      short: '控制在 100 字左右',
      medium: '控制在 300-500 字',
      long: '详细内容，不少于 800 字',
    };

    let prompt = `请为 ${platformNames[platform]} 生成一篇营销/品牌内容。\n\n任务主题：${topic}\n`;

    if (brandMemory) {
      prompt += `\n【品牌护城河】\n- 品牌名：${brandMemory.name || '未设置'}\n- 行业：${brandMemory.industry || '未设置'}\n- 品牌语调(ToV)：${brandMemory.voice || '专业'}\n- 品牌风格：${brandMemory.style?.join('、') || '默认'}\n`;
    }

    if (searchResults && searchResults.length > 0) {
      prompt += `\n【RAG 知识库检索结果（作为事实依据）】\n${searchResults.slice(0, 4).map(r => `- ${r.content}`).join('\n')}\n`;
    }

    if (style) prompt += `\n内容风格设定：${style}`;
    if (length) prompt += `\n长度要求：${lengthInstructions[length]}`;
    if (requirements) prompt += `\n用户特殊要求：${requirements}`;

    prompt += `\n\n【平台算法适配要求】
- 预估字数：${config.minLength}-${config.maxLength} 字
- 基础风格倾向：${config.style.join('、')}
${platform === 'xiaohongshu' ? '- 必须包含吸睛的标题（带emoji），正文分段清晰，善用表情符号，文末带有热门相关话题标签。' : ''}
${platform === 'douyin' || platform === 'tiktok' ? '- 这是视频口播脚本！前3秒必须有 Hook（钩子）抓住眼球，语言高度口语化，提示画面配合。' : ''}
${platform === 'twitter' ? '- 必须直击痛点，适合转发，包含 1-2 个精准的 Hashtag。' : ''}
${platform === 'linkedin' ? '- 必须展现行业领导力(Thought Leadership)，排版专业，不要过度使用花哨的表情，适合 B2B 传播。' : ''}
${platform === 'instagram' ? '- 注重视听通感描述，适合配图，文末需堆叠相关的海外热门标签（如 #OOTD, #Tech 等）。' : ''}
`;

    prompt += `\n\n必须严格返回 JSON 格式：
{
  "title": "标题 (如果是短图文或视频，可以是前三秒文案)",
  "body": "正文内容",
  "hashtags": ["tag1", "tag2"],
  "suggestedTime": "推荐的发布时间段（如：周五下午6点）"
}`;

    return prompt;
  }

  private parseGeneratedContent(response: string, platform: Platform, topic: string): GeneratedContent {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `content_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          platform,
          type: this.getContentType(platform),
          title: parsed.title || topic,
          body: parsed.body || response,
          hashtags: parsed.hashtags || [],
          suggestedTime: parsed.suggestedTime,
          score: 0.8,
        };
      }
    } catch { }
    return { id: `content_${Date.now()}`, platform, type: this.getContentType(platform), title: topic, body: response, score: 0.5 };
  }

  private getContentType(platform: Platform): ContentType {
    switch (platform) {
      case 'wechat': case 'zhihu': case 'bilibili': case 'linkedin': return 'article';
      case 'douyin': case 'tiktok': return 'video_script';
      default: return 'short_post';
    }
  }
}