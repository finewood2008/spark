/**
 * VI超市 数据模型
 * 
 * 商业逻辑：
 * - 按行业垂直生产标准VI套装，用户低价即买即用
 * - 三档定价：基础包/标准包/旗舰包
 * - 购买后支持三层可编辑性：免费微调 / 轻度定制 / 深度改造
 * - VI超市同时作为AI定制服务的"灵感入口"
 */

// ========== 行业分类 ==========
export interface IndustryCategory {
  id: string;
  name: string;
  icon: string;       // emoji
  subcategories: string[];
}

export const INDUSTRIES: IndustryCategory[] = [
  { id: 'food', name: '餐饮', icon: '🍽️', subcategories: ['咖啡馆', '茶饮', '烘焙', '火锅', '日料', '西餐', '快餐', '酒吧'] },
  { id: 'retail', name: '零售', icon: '🛍️', subcategories: ['服饰', '美妆', '家居', '数码', '母婴', '宠物', '花店', '文创'] },
  { id: 'tech', name: '科技', icon: '💻', subcategories: ['SaaS', 'AI', '硬件', '游戏', '区块链', '物联网', '开发者工具'] },
  { id: 'edu', name: '教育', icon: '📚', subcategories: ['K12', '职业培训', '语言', '艺术', '体育', '早教', '在线课程'] },
  { id: 'health', name: '健康', icon: '💪', subcategories: ['健身房', '瑜伽', '医美', '心理', '营养', '中医', '口腔'] },
  { id: 'service', name: '服务', icon: '🏢', subcategories: ['法律', '财税', '咨询', '设计', '摄影', '婚庆', '旅行', '物流'] },
  { id: 'lifestyle', name: '生活方式', icon: '✨', subcategories: ['民宿', '露营', '手作', '音乐', '书店', '画廊'] },
];

// ========== 套餐档位 ==========
export type TierType = 'basic' | 'standard' | 'premium';

export interface PriceTier {
  type: TierType;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  includes: string[];
}

export const PRICE_TIERS: Record<TierType, Omit<PriceTier, 'price' | 'originalPrice'>> = {
  basic: {
    type: 'basic',
    name: '基础包',
    description: '快速启动，满足基本需求',
    includes: [
      '主Logo（横版+竖版+图标版）',
      '5色品牌色板',
      '2套字体组合',
      '基础使用规范（1页）',
    ],
  },
  standard: {
    type: 'standard',
    name: '标准包',
    description: '最受欢迎，覆盖日常场景',
    includes: [
      '基础包全部内容',
      '名片设计（正反面）',
      '社交媒体模板（微信/小红书/抖音）',
      'Logo深色底/浅色底/单色版',
      '品牌规范手册（5-8页PDF）',
    ],
  },
  premium: {
    type: 'premium',
    name: '旗舰包',
    description: '全套物料，开箱即用',
    includes: [
      '标准包全部内容',
      '海报模板 ×3',
      'PPT模板',
      '信纸/信封模板',
      '包装贴纸模板',
      '完整VI手册（15-20页）',
    ],
  },
};

// ========== Mockup 场景 ==========
export interface MockupScene {
  id: string;
  name: string;
  description: string;
}

// ========== VI 商品 ==========
export interface VIProduct {
  id: string;
  name: string;
  subtitle: string;           // 一句话风格描述
  industry: string;           // 行业ID
  subcategory: string;        // 子分类
  tags: string[];

  // 视觉
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  bgColor: string;
  fonts: { heading: string; body: string };
  logoText: string;           // Logo文字（用于预览渲染）
  logoIcon: string;           // Logo图标描述

  // 定价（每个商品可以有不同的基础价）
  pricing: {
    basic: number;
    standard: number;
    premium: number;
  };

  // 元数据
  creator: string;
  sales: number;
  rating: number;             // 4.0-5.0
  isExclusive: boolean;       // 是否独占（卖出后下架）
  isNew: boolean;
  isFeatured: boolean;

  // 品牌故事
  story: string;
  designConcept: string;      // 设计理念

  // Mockup预览图（实际项目中是URL，这里用描述占位）
  mockups: {
    card: string;             // 名片效果
    storefront: string;       // 门头效果
    phone: string;            // 手机屏幕效果
    packaging: string;        // 包装效果
  };
}

// ========== 购买记录 ==========
export interface PurchasedVI {
  productId: string;
  product: VIProduct;
  tier: TierType;
  purchasedAt: string;
  // 用户微调后的值
  customizations: {
    brandName: string;        // 替换的品牌名
    primaryColor: string;     // 微调后的主色
    secondaryColor: string;
    headingFont: string;
    bodyFont: string;
  };
  appliedToBrandId: string | null;
}

// ========== 超市视图状态 ==========
export type MarketView = 'browse' | 'detail' | 'customize';
