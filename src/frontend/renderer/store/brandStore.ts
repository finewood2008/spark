/**
 * brandStore.ts - 品牌全局状态管理
 * 
 * 一个品牌 = 一套 VI（视觉） + 一本品牌字典（文字）
 * 用户可拥有多个品牌，但同一时间只能激活一个
 */
import { create } from 'zustand';

// ========== 视觉资产 (VI) ==========
export interface BrandVI {
  logo: {
    standard?: string;   // 标准版 URL/base64
    inverted?: string;   // 反白版
    icon?: string;       // 单色图标
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
  };
  // 图形语言
  graphicStyle?: {
    borderRadius: string;   // 如 '16px'
    iconStyle: string;      // 如 '线性' | '填充' | '双色'
  };
  source: 'uploaded' | 'market' | 'ai_generated' | 'none';
}

// ========== 品牌字典（文字层）==========

export type FieldStatus = 'empty' | 'user_filled' | 'ai_generated' | 'confirmed';

export interface DictField {
  value: string;
  status: FieldStatus;
  required: boolean;       // 是否为用户必填项
  label: string;
  placeholder: string;
  hint?: string;           // 填写提示
  multiline?: boolean;
}

export interface BrandDictionary {
  // === 用户必填项 ===
  brandName: DictField;
  industry: DictField;
  mainBusiness: DictField;       // 主营产品或服务
  targetCustomer: DictField;     // 目标客户
  differentiation: DictField;    // 核心差异化

  // === AI 补齐项 ===
  mission: DictField;            // 品牌使命
  vision: DictField;             // 品牌愿景
  values: DictField;             // 品牌价值观
  personality: DictField;        // 品牌个性
  brandStory: DictField;         // 品牌故事
  toneOfVoice: DictField;       // 语调指南
  slogans: DictField;           // Slogan 建议
  customerProfile: DictField;    // 详细客群画像
  sellingPoints: DictField;      // 产品卖点提炼
  keywords: DictField;           // 推荐用词
  tabooWords: DictField;         // 禁忌词
}

// ========== 品牌实体 ==========
export interface Brand {
  id: string;
  name: string;
  brandColor: string;      // 品牌标识色（用首字母+色块代替 emoji）
  active: boolean;
  createdAt: string;
  vi: BrandVI;
  dictionary: BrandDictionary;
  completeness: number;    // 0-100 品牌完整度
}

// ========== Store ==========
interface BrandStore {
  brands: Brand[];
  activeBrandId: string | null;

  // 品牌管理
  getActiveBrand: () => Brand | null;
  switchBrand: (id: string) => void;
  createBrand: (name: string, brandColor?: string) => string;
  deleteBrand: (id: string) => void;

  // 字典操作
  updateDictField: (brandId: string, field: keyof BrandDictionary, value: string, status?: FieldStatus) => void;
  confirmField: (brandId: string, field: keyof BrandDictionary) => void;
  batchUpdateDict: (brandId: string, updates: Partial<Record<keyof BrandDictionary, { value: string; status: FieldStatus }>>) => void;

  // VI 操作
  updateVI: (brandId: string, vi: Partial<BrandVI>) => void;

  // 完整度计算
  recalcCompleteness: (brandId: string) => void;
}

// 创建空白品牌字典
function createEmptyDictionary(): BrandDictionary {
  return {
    // 用户必填
    brandName:       { value: '', status: 'empty', required: true,  label: '品牌名称', placeholder: '如：蓝瓶咖啡', hint: '你的品牌叫什么名字？' },
    industry:        { value: '', status: 'empty', required: true,  label: '所在行业', placeholder: '如：精品咖啡 / SaaS 软件 / 母婴用品', hint: '你所在的行业或赛道' },
    mainBusiness:    { value: '', status: 'empty', required: true,  label: '主营业务', placeholder: '简单描述你的核心产品或服务', hint: '你卖什么？提供什么服务？', multiline: true },
    targetCustomer:  { value: '', status: 'empty', required: true,  label: '目标客户', placeholder: '如：25-35岁都市白领女性', hint: '你的产品主要卖给谁？' },
    differentiation: { value: '', status: 'empty', required: true,  label: '核心差异化', placeholder: '跟竞争对手比，你最大的不同是什么？', hint: '客户为什么选你而不选别人？', multiline: true },

    // AI 补齐
    mission:         { value: '', status: 'empty', required: false, label: '品牌使命', placeholder: 'AI 将根据你的基本信息自动生成', hint: '我们为什么存在？', multiline: true },
    vision:          { value: '', status: 'empty', required: false, label: '品牌愿景', placeholder: 'AI 将根据你的基本信息自动生成', hint: '我们要去哪里？', multiline: true },
    values:          { value: '', status: 'empty', required: false, label: '品牌价值观', placeholder: 'AI 将根据你的基本信息自动生成', hint: '我们相信什么？', multiline: true },
    personality:     { value: '', status: 'empty', required: false, label: '品牌个性', placeholder: 'AI 将根据你的基本信息自动生成', hint: '如果品牌是一个人，TA 是什么性格？', multiline: true },
    brandStory:      { value: '', status: 'empty', required: false, label: '品牌故事', placeholder: 'AI 将根据你的基本信息自动生成', hint: '品牌的起源和发展历程', multiline: true },
    toneOfVoice:     { value: '', status: 'empty', required: false, label: '语调指南', placeholder: 'AI 将根据你的基本信息自动生成', hint: '品牌说话的方式和风格', multiline: true },
    slogans:         { value: '', status: 'empty', required: false, label: 'Slogan 建议', placeholder: 'AI 将生成 2-3 个备选', hint: '品牌的核心口号' },
    customerProfile: { value: '', status: 'empty', required: false, label: '客群画像', placeholder: 'AI 将根据你的目标客户描述展开', hint: '目标客户的详细特征', multiline: true },
    sellingPoints:   { value: '', status: 'empty', required: false, label: '产品卖点', placeholder: 'AI 将根据你的业务描述提炼', hint: '核心卖点和价值主张', multiline: true },
    keywords:        { value: '', status: 'empty', required: false, label: '推荐用词', placeholder: 'AI 将根据品牌调性推荐', hint: '品牌内容中推荐使用的词汇' },
    tabooWords:      { value: '', status: 'empty', required: false, label: '禁忌词', placeholder: 'AI 将根据行业和调性推荐', hint: '品牌内容中应避免的词汇' },
  };
}

function createEmptyVI(): BrandVI {
  return {
    logo: {},
    colors: { primary: '#FF6B35', secondary: '#1E3A5F', accent: '#FFB347', neutral: '#6B7280', background: '#F9FAFB' },
    fonts: { heading: 'Inter', body: 'Noto Sans SC' },
    source: 'none',
  };
}

function calcCompleteness(brand: Brand): number {
  const dict = brand.dictionary;
  const dictFields = Object.values(dict) as DictField[];
  const totalFields = dictFields.length;
  const filledFields = dictFields.filter(f => f.status !== 'empty').length;
  const confirmedFields = dictFields.filter(f => f.status === 'confirmed' || f.status === 'user_filled').length;

  const dictScore = (filledFields / totalFields) * 50 + (confirmedFields / totalFields) * 20;
  const viScore = brand.vi.source !== 'none' ? 30 : 0;

  return Math.min(100, Math.round(dictScore + viScore));
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  brands: [
    // 默认示例品牌
    {
      id: 'brand_demo',
      name: '示例品牌',
      brandColor: '#8B5A2B',
      active: true,
      createdAt: new Date().toISOString(),
      vi: createEmptyVI(),
      dictionary: createEmptyDictionary(),
      completeness: 0,
    }
  ],
  activeBrandId: 'brand_demo',

  getActiveBrand: () => {
    const { brands, activeBrandId } = get();
    return brands.find(b => b.id === activeBrandId) || null;
  },

  switchBrand: (id) => set(state => ({
    activeBrandId: id,
    brands: state.brands.map(b => ({ ...b, active: b.id === id })),
  })),

  createBrand: (name, brandColor?: string) => {
    const id = `brand_${Date.now()}`;
    const newBrand: Brand = {
      id, name, brandColor: brandColor || ['#FF6B35','#2EC4B6','#8338EC','#E71D36','#3A86FF','#FFBE0B'][Math.floor(Math.random()*6)], active: false,
      createdAt: new Date().toISOString(),
      vi: createEmptyVI(),
      dictionary: (() => { const d = createEmptyDictionary(); d.brandName.value = name; d.brandName.status = 'user_filled'; return d; })(),
      completeness: 0,
    };
    set(state => ({ brands: [...state.brands, newBrand] }));
    return id;
  },

  deleteBrand: (id) => set(state => ({
    brands: state.brands.filter(b => b.id !== id),
    activeBrandId: state.activeBrandId === id ? (state.brands[0]?.id || null) : state.activeBrandId,
  })),

  updateDictField: (brandId, field, value, status) => set(state => ({
    brands: state.brands.map(b => {
      if (b.id !== brandId) return b;
      const newDict = { ...b.dictionary };
      newDict[field] = { ...newDict[field], value, status: status || (value ? 'user_filled' : 'empty') };
      const newBrand = { ...b, dictionary: newDict };
      newBrand.completeness = calcCompleteness(newBrand);
      return newBrand;
    }),
  })),

  confirmField: (brandId, field) => set(state => ({
    brands: state.brands.map(b => {
      if (b.id !== brandId) return b;
      const newDict = { ...b.dictionary };
      newDict[field] = { ...newDict[field], status: 'confirmed' };
      const newBrand = { ...b, dictionary: newDict };
      newBrand.completeness = calcCompleteness(newBrand);
      return newBrand;
    }),
  })),

  batchUpdateDict: (brandId, updates) => set(state => ({
    brands: state.brands.map(b => {
      if (b.id !== brandId) return b;
      const newDict = { ...b.dictionary };
      for (const [key, val] of Object.entries(updates)) {
        if (val && key in newDict) {
          newDict[key as keyof BrandDictionary] = { ...newDict[key as keyof BrandDictionary], ...val };
        }
      }
      const newBrand = { ...b, dictionary: newDict };
      newBrand.completeness = calcCompleteness(newBrand);
      return newBrand;
    }),
  })),

  updateVI: (brandId, viUpdate) => set(state => ({
    brands: state.brands.map(b => {
      if (b.id !== brandId) return b;
      const newVI = { ...b.vi, ...viUpdate };
      if (viUpdate.logo) newVI.logo = { ...b.vi.logo, ...viUpdate.logo };
      if (viUpdate.colors) newVI.colors = { ...b.vi.colors, ...viUpdate.colors };
      if (viUpdate.fonts) newVI.fonts = { ...b.vi.fonts, ...viUpdate.fonts };
      const newBrand = { ...b, vi: newVI };
      newBrand.completeness = calcCompleteness(newBrand);
      return newBrand;
    }),
  })),

  recalcCompleteness: (brandId) => set(state => ({
    brands: state.brands.map(b => {
      if (b.id !== brandId) return b;
      return { ...b, completeness: calcCompleteness(b) };
    }),
  })),
}));
