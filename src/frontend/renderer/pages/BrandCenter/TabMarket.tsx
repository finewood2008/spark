/**
 * TabMarket.tsx - VI 超市 Tab
 * 从旧 BrandCenter.tsx 迁移超市逻辑，接入新的 brandStore
 */
import React, { useState } from 'react';
import { useBrandStore } from '../../store/brandStore';

interface VIMarketItem {
  id: string;
  name: string;
  style: string;
  price: string;
  color: string;
  tags: string[];
  creator: string;
  sales: number;
  story: string;
  logoSvg: string;
  fonts: string[];
  previewImages: string[];
}

const viMarketItems: VIMarketItem[] = [
  {
    id: 'vi_1', name: '极简咖啡馆', style: '日式冷淡 / 温暖木质', price: '¥99.00', color: '#8B5A2B',
    tags: ['餐饮', '咖啡', '原木风'], creator: 'Spark 官方', sales: 128,
    story: '灵感来源于京都街头的小巧咖啡馆。去除一切不必要的装饰，只保留木材质的温暖与咖啡的醇香。这套 VI 旨在传递一种"慢节奏"的生活态度，非常适合社区型、独立咖啡品牌。',
    logoSvg: '', fonts: ['Noto Serif SC', 'Helvetica Neue'],
    previewImages: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80'],
  },
  {
    id: 'vi_2', name: '赛博电竞馆', style: '高饱和度 / 霓虹', price: '¥199.00', color: '#00FF00',
    tags: ['娱乐', '电竞', '科技'], creator: '设计师 @Neo', sales: 45,
    story: '专为次世代电竞体验打造。采用高对比度的黑绿配色，结合硬朗的机甲风切割线条。',
    logoSvg: '', fonts: ['Teko', 'Orbitron'],
    previewImages: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'],
  },
  {
    id: 'vi_3', name: '独立设计师服饰', style: '黑白灰 / 粗野主义', price: '¥149.00', color: '#333333',
    tags: ['零售', '服饰', '先锋'], creator: 'Spark 官方', sales: 312,
    story: '回归服装本身的剪裁与质感。极致的黑白灰配色与粗野主义排版，彰显主理人不妥协的时尚态度。',
    logoSvg: '', fonts: ['Inter', 'Space Grotesk'],
    previewImages: ['https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80'],
  },
  { id: 'vi_4', name: '亲子游乐园', style: '高明度 / 糖果色', price: '¥129.00', color: '#FFB6C1', tags: ['教育', '母婴', '活泼'], creator: '设计师 @Momo', sales: 89, story: '快乐、安全、无忧无虑。', logoSvg: '', fonts: [], previewImages: [] },
  { id: 'vi_5', name: '新中式茶饮', style: '古典 / 禅意', price: '¥159.00', color: '#556B2F', tags: ['餐饮', '茶饮', '国风'], creator: 'Spark 官方', sales: 500, story: '传统茶文化与现代生活方式的碰撞。', logoSvg: '', fonts: [], previewImages: [] },
  { id: 'vi_6', name: '科技互联网', style: '扁平化 / 现代', price: '¥89.00', color: '#1E90FF', tags: ['科技', '软件', '现代'], creator: 'Spark 官方', sales: 210, story: '高效、透明、连接未来。', logoSvg: '', fonts: [], previewImages: [] },
];

const categories = ['全部', '餐饮', '零售', '娱乐', '科技', '教育'];

export function TabMarket() {
  const { getActiveBrand, updateVI } = useBrandStore();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedVI, setSelectedVI] = useState<VIMarketItem | null>(null);

  const filteredItems = selectedCategory === '全部'
    ? viMarketItems
    : viMarketItems.filter(item => item.tags.includes(selectedCategory));

  const handleBuyVI = (vi: VIMarketItem) => {
    const brand = getActiveBrand();
    if (!brand) return;
    if (window.confirm(`确认购买【${vi.name}】全套视觉方案（${vi.price}）？将应用到当前激活品牌「${brand.name}」。`)) {
      updateVI(brand.id, {
        source: 'market',
        colors: {
          primary: vi.color,
          secondary: `${vi.color}CC`,
          accent: '#FFB347',
          neutral: '#6B7280',
          background: '#F9FAFB',
        },
        fonts: {
          heading: vi.fonts[0] || 'Inter',
          body: vi.fonts[1] || 'Noto Sans SC',
        },
      });
      setSelectedVI(null);
    }
  };

  // 商品详情页
  if (selectedVI) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full animate-fade-in">
        <button
          onClick={() => setSelectedVI(null)}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          返回超市
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* 头图 */}
          <div className="h-48 flex items-center justify-center relative" style={{ backgroundColor: `${selectedVI.color}15` }}>
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center font-serif text-4xl font-bold" style={{ color: selectedVI.color }}>
              {selectedVI.name.charAt(0)}
            </div>
            <div className="absolute bottom-4 flex space-x-1.5">
              <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: selectedVI.color }}></div>
              <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: `${selectedVI.color}80` }}></div>
              <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm bg-white"></div>
              <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm bg-gray-900"></div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedVI.creator}</span>
              <span className="text-[10px] font-bold text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded">{selectedVI.sales} 人已购买</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedVI.name}</h1>
            <p className="text-sm text-gray-500 mb-6">{selectedVI.style}</p>

            <div className="bg-gray-50 p-5 rounded-xl mb-6">
              <div className="text-xs font-bold text-gray-500 mb-2">品牌基因设定</div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedVI.story}</p>
            </div>

            {selectedVI.fonts.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-gray-500 mb-2">字体家族</div>
                <div className="flex gap-2">
                  {selectedVI.fonts.map(f => (
                    <span key={f} className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 购买栏 */}
            <div className="bg-gray-900 p-5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs line-through mb-0.5">原价 ¥{Number(selectedVI.price.replace('¥', '')) * 2}.00</div>
                <div className="text-2xl font-bold text-white">{selectedVI.price}</div>
              </div>
              <button
                onClick={() => handleBuyVI(selectedVI)}
                className="px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#ff8050] transition-colors shadow-lg"
              >
                购买并应用到当前品牌
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 超市列表
  return (
    <div className="p-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-[10px] font-bold rounded">NEW</span>
            <span className="text-gray-400 text-xs">火花官方商城</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">一键注入<span className="text-[#FFB347]">大师级品牌视觉</span></h2>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            包含 Logo 源文件、标准字体组合、品牌色值表、排版规范。购买后直接应用到当前激活品牌。
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF6B35] rounded-full filter blur-[80px] opacity-20"></div>
      </div>

      {/* 分类筛选 */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${selectedCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(vi => (
          <div
            key={vi.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer hover:-translate-y-1"
            onClick={() => setSelectedVI(vi)}
          >
            <div className="h-40 flex flex-col items-center justify-center p-4 relative" style={{ backgroundColor: `${vi.color}12` }}>
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 flex items-center">
                {vi.sales} 人购买
              </div>
              <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center font-serif text-xl font-bold mb-2 group-hover:scale-110 transition-transform" style={{ color: vi.color }}>
                {vi.name.charAt(0)}
              </div>
              <div className="flex space-x-1">
                <div className="w-5 h-5 rounded border border-white shadow-sm" style={{ backgroundColor: vi.color }}></div>
                <div className="w-5 h-5 rounded border border-white shadow-sm" style={{ backgroundColor: `${vi.color}80` }}></div>
                <div className="w-5 h-5 rounded border border-white shadow-sm bg-white"></div>
                <div className="w-5 h-5 rounded border border-white shadow-sm bg-gray-900"></div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-1 mb-1.5">
                {vi.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded border border-gray-100">{tag}</span>
                ))}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5 group-hover:text-[#FF6B35] transition-colors">{vi.name}</h3>
              <p className="text-[11px] text-gray-400 mb-4">{vi.style}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#FF6B35]">{vi.price}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBuyVI(vi); }}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-[#FF6B35] transition-colors"
                >
                  一键导入
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <p className="text-sm">该分类下暂无方案，试试其他分类</p>
        </div>
      )}
    </div>
  );
}
