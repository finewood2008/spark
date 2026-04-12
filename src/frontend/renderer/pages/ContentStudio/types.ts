/**
 * ContentStudio 类型定义
 */

export type TargetPlatform = 'wechat' | 'xiaohongshu' | 'weibo' | 'zhihu' | 'bilibili' | 'linkedin' | 'twitter';

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'divider';
  content: string;       // text: 文案内容, image: 图片URL
  imagePrompt?: string;  // AI 配图的 prompt
  generating?: boolean;
}

export interface ArticleDraft {
  id: string;
  title: string;
  blocks: ContentBlock[];
  coverImage?: string;
  coverPrompt?: string;
  platforms: TargetPlatform[];
  style: 'professional' | 'casual' | 'storytelling' | 'tutorial';
  createdAt: number;
  updatedAt: number;
}

export interface PlatformPreview {
  platform: TargetPlatform;
  name: string;
  icon: string;
  maxTitle: number;
  maxBody: number;
  features: string[];
}

export const PLATFORM_LIST: PlatformPreview[] = [
  { platform: 'wechat',      name: '公众号', icon: '公', maxTitle: 64,  maxBody: 20000, features: ['长图文', '封面图', '摘要'] },
  { platform: 'xiaohongshu', name: '小红书', icon: '红', maxTitle: 100, maxBody: 1000,  features: ['种草笔记', 'emoji', '话题标签'] },
  { platform: 'weibo',       name: '微博',   icon: '博', maxTitle: 140, maxBody: 2000,  features: ['短图文', '话题', '九宫格'] },
  { platform: 'zhihu',       name: '知乎',   icon: '知', maxTitle: 100, maxBody: 50000, features: ['专栏文章', '引用', '深度'] },
  { platform: 'bilibili',    name: 'B站',    icon: 'B',  maxTitle: 80,  maxBody: 5000,  features: ['专栏', '图文动态'] },
  { platform: 'linkedin',    name: 'LinkedIn', icon: 'in', maxTitle: 100, maxBody: 3000, features: ['职场', 'B2B', '思想领导力'] },
  { platform: 'twitter',     name: 'X/推特', icon: 'X',  maxTitle: 0,   maxBody: 280,   features: ['短文', '话题', '互动'] },
];

export const STYLE_OPTIONS = [
  { id: 'professional' as const, label: '专业严谨', desc: '适合行业分析、产品介绍' },
  { id: 'casual' as const,       label: '轻松亲切', desc: '适合品牌故事、日常分享' },
  { id: 'storytelling' as const, label: '故事叙事', desc: '适合案例分享、品牌传播' },
  { id: 'tutorial' as const,     label: '教程干货', desc: '适合知识分享、使用指南' },
];
