/**
 * TabMarket.tsx - VI 超市（重构版）
 * 
 * 商业模式：按行业垂直生产标准VI套装，三档定价，购买后可微调
 * 用户路径：浏览 → 详情 → 选档位购买 → 微调 → 导入品牌
 */
import React, { useState, useMemo } from 'react';
import { useBrandStore } from '../../../store/brandStore';
import { VIProduct, MarketView, TierType, INDUSTRIES } from './types';
import { VI_PRODUCTS } from './data';
import { ProductDetail } from './ProductDetail';
import { CustomizePanel } from './CustomizePanel';

// ========== 超市主页 ==========
export function TabMarket() {
  const [view, setView] = useState<MarketView>('browse');
  const [selectedProduct, setSelectedProduct] = useState<VIProduct | null>(null);
  const [purchasedTier, setPurchasedTier] = useState<TierType | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // 筛选逻辑
  const filteredProducts = useMemo(() => {
    let items = [...VI_PRODUCTS];
    if (selectedIndustry !== 'all') items = items.filter(p => p.industry === selectedIndustry);
    if (selectedSub !== 'all') items = items.filter(p => p.subcategory === selectedSub);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => p.name.includes(q) || p.subtitle.includes(q) || p.tags.some(t => t.includes(q)));
    }
    if (sortBy === 'popular') items.sort((a, b) => b.sales - a.sales);
    else if (sortBy === 'newest') items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    else if (sortBy === 'price') items.sort((a, b) => a.pricing.basic - b.pricing.basic);
    return items;
  }, [selectedIndustry, selectedSub, sortBy, searchQuery]);

  const currentIndustry = INDUSTRIES.find(i => i.id === selectedIndustry);
  const featuredProducts = VI_PRODUCTS.filter(p => p.isFeatured);

  // 购买回调
  const handlePurchase = (product: VIProduct, tier: TierType) => {
    setSelectedProduct(product);
    setPurchasedTier(tier);
    setView('customize');
  };

  // 导入完成回调
  const handleImportDone = () => {
    setView('browse');
    setSelectedProduct(null);
    setPurchasedTier(null);
  };

  // ===== 微调面板 =====
  if (view === 'customize' && selectedProduct && purchasedTier) {
    return (
      <CustomizePanel
        product={selectedProduct}
        tier={purchasedTier}
        onBack={() => { setView('detail'); setPurchasedTier(null); }}
        onDone={handleImportDone}
      />
    );
  }

  // ===== 商品详情 =====
  if (view === 'detail' && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => { setView('browse'); setSelectedProduct(null); }}
        onPurchase={handlePurchase}
      />
    );
  }

  // ===== 超市浏览 =====
  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8F5E] rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">🏪 VI 超市</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">{VI_PRODUCTS.length} 套精选方案</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">专业品牌视觉，即买即用</h2>
          <p className="text-white/80 text-sm max-w-lg leading-relaxed">
            每套包含 Logo + 配色 + 字体 + 物料模板。按行业精心设计，购买后一键导入你的品牌，还能自由微调。
          </p>
          <div className="flex gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <div className="text-lg font-bold">¥99</div>
              <div className="text-[10px] text-white/70">起</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <div className="text-lg font-bold">3档</div>
              <div className="text-[10px] text-white/70">套餐</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <div className="text-lg font-bold">可改</div>
              <div className="text-[10px] text-white/70">买后微调</div>
            </div>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full"></div>
        <div className="absolute right-20 -top-10 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* 精选推荐横滑 */}
      {featuredProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">🔥 编辑精选</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {featuredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => { setSelectedProduct(p); setView('detail'); }}
                className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
              >
                <div className="h-28 relative flex items-center justify-center" style={{ backgroundColor: `${p.primaryColor}10` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: p.primaryColor }}>
                      {p.logoText.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{p.subtitle}</div>
                    </div>
                  </div>
                  {p.isNew && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#FF6B35] text-white text-[9px] font-bold rounded">NEW</span>}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {[p.primaryColor, p.secondaryColor, p.accentColor].map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#FF6B35]">¥{p.pricing.basic}起</span>
                  <span className="text-[10px] text-gray-400">{p.sales}人购买</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索 + 排序 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="搜索风格、行业、关键词..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#FF6B35]"
        >
          <option value="popular">最热门</option>
          <option value="newest">最新上架</option>
          <option value="price">价格最低</option>
        </select>
      </div>

      {/* 行业筛选 */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => { setSelectedIndustry('all'); setSelectedSub('all'); }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedIndustry === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35]'
          }`}
        >全部</button>
        {INDUSTRIES.map(ind => (
          <button
            key={ind.id}
            onClick={() => { setSelectedIndustry(ind.id); setSelectedSub('all'); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedIndustry === ind.id ? 'bg-[#FF6B35] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35]'
            }`}
          >{ind.icon} {ind.name}</button>
        ))}
      </div>

      {/* 子分类 */}
      {currentIndustry && (
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSub('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
              selectedSub === 'all' ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-500 hover:text-[#FF6B35]'
            }`}
          >全部{currentIndustry.name}</button>
          {currentIndustry.subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSub(sub)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                selectedSub === sub ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-500 hover:text-[#FF6B35]'
              }`}
            >{sub}</button>
          ))}
        </div>
      )}

      {/* 商品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(vi => (
          <div
            key={vi.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer hover:-translate-y-1"
            onClick={() => { setSelectedProduct(vi); setView('detail'); }}
          >
            {/* 预览区 */}
            <div className="h-44 relative flex items-center justify-center p-4" style={{ backgroundColor: vi.bgColor }}>
              {vi.isNew && <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#FF6B35] text-white text-[9px] font-bold rounded-full">NEW</span>}
              {vi.isExclusive && <span className="absolute top-3 left-3 px-2 py-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-full">独占</span>}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <span className="text-[10px] text-yellow-500">★</span>
                <span className="text-[10px] font-medium text-gray-600">{vi.rating}</span>
              </div>

              {/* Logo预览 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: vi.primaryColor }}>
                  {vi.logoText.charAt(0)}
                </div>
                <div className="font-bold text-gray-800 text-sm tracking-wide">{vi.logoText}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{vi.subtitle}</div>
              </div>

              {/* 色板 */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {[vi.primaryColor, vi.secondaryColor, vi.accentColor, vi.neutralColor].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }}></div>
                ))}
              </div>
            </div>

            {/* 信息区 */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                {vi.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded border border-gray-100">{tag}</span>
                ))}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5 group-hover:text-[#FF6B35] transition-colors">{vi.name}</h3>
              <p className="text-[11px] text-gray-400 mb-3 line-clamp-1">{vi.story}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[#FF6B35]">¥{vi.pricing.basic}</span>
                  <span className="text-[10px] text-gray-400">起</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{vi.sales}人购买</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(vi); setView('detail'); }}
                    className="px-3 py-1.5 bg-[#FF6B35] text-white text-xs font-bold rounded-lg hover:bg-[#ff8050] transition-colors"
                  >查看</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">没有找到匹配的VI方案</p>
          <p className="text-xs mt-1">试试其他行业分类，或者<button onClick={() => { setSelectedIndustry('all'); setSelectedSub('all'); setSearchQuery(''); }} className="text-[#FF6B35] hover:underline">清除筛选</button></p>
        </div>
      )}

      {/* 底部引导 */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
        <div className="text-lg mb-1">🎨 没找到满意的？</div>
        <p className="text-sm text-gray-500 mb-4">让 AI 根据你的品牌理念，从零定制一套专属VI</p>
        <button className="px-6 py-2.5 bg-white border-2 border-[#FF6B35] text-[#FF6B35] font-bold rounded-xl hover:bg-[#FF6B35] hover:text-white transition-all text-sm">
          去 AI 工作台定制 →
        </button>
      </div>
    </div>
  );
}
