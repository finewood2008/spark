/**
 * AI 工作台类型定义 v2
 * 
 * 核心理念：无限画布 + 生成卡片堆积
 * 用户不断烧 token 生成内容，画布上堆满结果
 */

// 画布上的一张生成卡片
export interface GenerationCard {
  id: string;
  // 画布位置
  x: number;
  y: number;
  width: number;
  height: number;
  // 生成信息
  type: GenerationType;
  prompt: string;
  status: 'generating' | 'done' | 'error';
  // 结果
  imageUrl?: string;       // base64 或 URL
  title?: string;          // 卡片标题（如"Logo 方案 1"）
  // 元数据
  createdAt: number;
  groupId?: string;        // 同一批次生成的归为一组
}

// 生成类型 — 场景化引导
export type GenerationType =
  | 'logo'           // Logo 设计
  | 'color_palette'  // 配色方案
  | 'business_card'  // 名片
  | 'poster'         // 海报
  | 'social_cover'   // 社交封面（小红书/公众号）
  | 'banner'         // 横幅
  | 'icon_set'       // 图标集
  | 'brand_board'    // 品牌板（全套 VI 预览）
  | 'free';          // 自由生成

// 快捷生成场景
export interface QuickScene {
  id: GenerationType;
  icon: string;
  label: string;
  description: string;
  defaultPrompt: string;
  batchCount: number;  // 一次生成几张
  cardSize: { w: number; h: number };
}

// 预设场景列表
export const QUICK_SCENES: QuickScene[] = [
  {
    id: 'logo',
    icon: 'spark',
    label: 'Logo 设计',
    description: '一次生成 4 个方案',
    defaultPrompt: '为品牌设计一个简约现代的 Logo',
    batchCount: 4,
    cardSize: { w: 240, h: 240 },
  },
  {
    id: 'color_palette',
    icon: 'palette',
    label: '配色方案',
    description: '生成品牌配色板',
    defaultPrompt: '生成一套温暖专业的品牌配色方案',
    batchCount: 3,
    cardSize: { w: 320, h: 200 },
  },
  {
    id: 'business_card',
    icon: 'card',
    label: '名片设计',
    description: '正反面各 2 版',
    defaultPrompt: '设计一张简约大气的商务名片',
    batchCount: 4,
    cardSize: { w: 320, h: 200 },
  },
  {
    id: 'poster',
    icon: 'poster',
    label: '海报',
    description: '宣传海报 3 版',
    defaultPrompt: '设计一张品牌宣传海报',
    batchCount: 3,
    cardSize: { w: 240, h: 340 },
  },
  {
    id: 'social_cover',
    icon: 'phone',
    label: '社交封面',
    description: '小红书/公众号封面',
    defaultPrompt: '生成小红书风格的品牌封面图',
    batchCount: 4,
    cardSize: { w: 240, h: 320 },
  },
  {
    id: 'banner',
    icon: 'banner',
    label: '横幅 Banner',
    description: '网站/店铺横幅',
    defaultPrompt: '设计一张品牌横幅 Banner',
    batchCount: 3,
    cardSize: { w: 400, h: 160 },
  },
  {
    id: 'brand_board',
    icon: 'vi',
    label: '全套 VI',
    description: '一键生成品牌视觉全家桶',
    defaultPrompt: '生成完整的品牌视觉识别系统',
    batchCount: 8,
    cardSize: { w: 280, h: 280 },
  },
  {
    id: 'free',
    icon: 'free',
    label: '自由生成',
    description: '输入任意描述',
    defaultPrompt: '',
    batchCount: 4,
    cardSize: { w: 280, h: 280 },
  },
];

// 画布视口状态
export interface ViewportState {
  x: number;      // 平移 X
  y: number;      // 平移 Y
  zoom: number;   // 缩放
}
