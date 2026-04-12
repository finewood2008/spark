/**
 * ProductDetail.tsx - VI商品详情页
 * 
 * 展示：Logo预览 + Mockup场景 + 色板字体 + 三档套餐选择 + 购买
 */
import React, { useState } from 'react';
import { VIProduct, TierType, PRICE_TIERS } from './types';

interface Props {
  product: VIProduct;
  onBack: () => void;
  onPurchase: (product: VIProduct, tier: TierType) => void;
}

const MOCKUP_LABELS: Record<string, { icon: string; label: string }> = {
  card: { icon: '💳', label: '名片效果' },
  storefront: { icon: '🏪', label: '门头效果' },
  phone: { icon: '📱', label: '手机屏幕' },
  packaging: { icon: '📦', label: '包装效果' },
};

export function ProductDetail({ product, onBack, onPurchase }: Props) {
  const [selectedTier, setSelectedTier] = useState<TierType>('standard');
  const [activeMockup, setActiveMockup] = useState<string>('card');

  const tierPrices: Record<TierType, number> = product.pricing;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full animate-fade-in">
      {/* 返回 */}
      <button onClick={onBack} className="flex items-center text-gray-400 hover:text-gray-900 mb-6 transition-colors text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        返回超市
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧：预览区 (3列) */}
        <div className="lg:col-span-3">
          {/* 主预览 */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: product.bgColor }}>
            <div className="h-72 flex flex-col items-center justify-center relative p-8">
              {/* Logo大图 */}
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-2xl mb-4" style={{ backgroundColor: product.primaryColor }}>
                {product.logoText.charAt(0)}
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-wider mb-1">{product.logoText}</div>
              <div className="text-xs text-gray-400">{product.subtitle}</div>

              {/* 色板浮层 */}
              <div className="absolute bottom-4 left-4 flex gap-1.5">
                {[
                  { color: product.primaryColor, label: '主色' },
                  { color: product.secondaryColor, label: '辅色' },
                  { color: product.accentColor, label: '强调' },
                  { color: product.neutralColor, label: '中性' },
                  { color: product.bgColor, label: '背景' },
                ].map((c, i) => (
                  <div key={i} className="group relative">
                    <div className="w-7 h-7 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c.color }}></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {c.label}: {c.color}
                    </div>
                  </div>
                ))}
              </div>

              {/* 评分 */}
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="text-yellow-500 text-xs">★</span>
                <span className="text-xs font-bold text-gray-700">{product.rating}</span>
                <span className="text-[10px] text-gray-400">· {product.sales}人购买</span>
              </div>
            </div>
          </div>

          {/* Mockup 场景切换 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {Object.entries(product.mockups).map(([key, desc]) => {
              const meta = MOCKUP_LABELS[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveMockup(key)}
                  className={`rounded-xl p-3 text-center transition-all ${
                    activeMockup === key
                      ? 'bg-[#FF6B35]/10 border-2 border-[#FF6B35]'
                      : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="text-xl mb-1">{meta.icon}</div>
                  <div className="text-[10px] font-medium text-gray-600">{meta.label}</div>
                </button>
              );
            })}
          </div>

          {/* Mockup 描述卡 */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{MOCKUP_LABELS[activeMockup]?.icon}</span>
              <span className="text-sm font-bold text-gray-700">{MOCKUP_LABELS[activeMockup]?.label}</span>
            </div>
            <div className="h-32 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${product.primaryColor}08` }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: product.primaryColor }}>
                  {product.logoText.charAt(0)}
                </div>
                <div className="text-xs text-gray-500">{product.mockups[activeMockup as keyof typeof product.mockups]}</div>
              </div>
            </div>
          </div>

          {/* 设计理念 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">💡 设计理念</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{product.designConcept}</p>
          </div>

          {/* 品牌故事 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">📖 品牌故事</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{product.story}</p>
          </div>

          {/* 字体 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-3">🔤 字体组合</h4>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-400 mb-1">标题字体</div>
                <div className="text-lg font-bold text-gray-900" style={{ fontFamily: product.fonts.heading }}>{product.fonts.heading}</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-400 mb-1">正文字体</div>
                <div className="text-lg text-gray-700" style={{ fontFamily: product.fonts.body }}>{product.fonts.body}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：购买区 (2列) */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            {/* 商品标题 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">{tag}</span>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
              <p className="text-sm text-gray-400">{product.subtitle} · by {product.creator}</p>
            </div>

            {/* 三档套餐 */}
            <div className="space-y-3 mb-6">
              {(['basic', 'standard', 'premium'] as TierType[]).map(tier => {
                const meta = PRICE_TIERS[tier];
                const price = tierPrices[tier];
                const isSelected = selectedTier === tier;
                const isPopular = tier === 'standard';
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left rounded-xl p-4 transition-all relative ${
                      isSelected
                        ? 'border-2 border-[#FF6B35] bg-[#FF6B35]/5'
                        : 'border-2 border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#FF6B35] text-white text-[9px] font-bold rounded-full">最受欢迎</span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#FF6B35]' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF6B35]"></div>}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{meta.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#FF6B35]">¥{price}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 ml-6 mb-2">{meta.description}</p>
                    <div className="ml-6 space-y-1">
                      {meta.includes.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {item}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 购买按钮 */}
            <button
              onClick={() => onPurchase(product, selectedTier)}
              className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#ff8050] transition-colors shadow-lg shadow-[#FF6B35]/20 text-sm mb-3"
            >
              购买 {PRICE_TIERS[selectedTier].name} · ¥{tierPrices[selectedTier]}
            </button>

            <p className="text-center text-[10px] text-gray-400">
              购买后可免费微调品牌名、主色调和字体
            </p>

            {/* 保障 */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '✏️', text: '买后可改' },
                  { icon: '📦', text: '源文件交付' },
                  { icon: '🔒', text: '行业不重复' },
                  { icon: '💬', text: '售后支持' },
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm">{g.icon}</span>
                    <span className="text-[11px] text-gray-500">{g.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 深度定制引导 */}
            <div className="mt-4 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-2">喜欢这个风格但想要更个性化？</p>
              <button className="text-xs text-[#FF6B35] font-medium hover:underline">
                基于此方案 AI 深度定制 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
