/**
 * CustomizePanel.tsx - 购买后微调面板
 * 
 * 三层可编辑性：
 * 1. 免费微调：改品牌名、主色调色相偏移、字体切换
 * 2. 轻度定制（加99元）：完全自定义配色、增减物料
 * 3. 深度改造（加299元）：AI基于骨架重新演绎 → 跳转AI工作台
 */
import React, { useState } from 'react';
import { VIProduct, TierType, PRICE_TIERS } from './types';
import { useBrandStore } from '../../../store/brandStore';

interface Props {
  product: VIProduct;
  tier: TierType;
  onBack: () => void;
  onDone: () => void;
}

// 预设色相偏移（同色系内微调）
function shiftHue(hex: string, degrees: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  h = ((h * 360 + degrees) % 360) / 360;
  if (h < 0) h += 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p2 = 2 * l - q2;
  const rr = Math.round(hue2rgb(p2, q2, h + 1/3) * 255);
  const gg = Math.round(hue2rgb(p2, q2, h) * 255);
  const bb = Math.round(hue2rgb(p2, q2, h - 1/3) * 255);
  return `#${rr.toString(16).padStart(2,'0')}${gg.toString(16).padStart(2,'0')}${bb.toString(16).padStart(2,'0')}`;
}

const FONT_OPTIONS = [
  { heading: 'Inter', body: 'Noto Sans SC', label: '现代无衬线' },
  { heading: 'Noto Serif SC', body: 'Noto Sans SC', label: '经典衬线' },
  { heading: 'Space Grotesk', body: 'Inter', label: '科技几何' },
  { heading: 'Playfair Display', body: 'Noto Sans SC', label: '优雅衬线' },
  { heading: 'ZCOOL KuaiLe', body: 'Noto Sans SC', label: '活泼圆体' },
  { heading: 'Cormorant Garamond', body: 'Noto Sans SC', label: '轻奢衬线' },
  { heading: 'Montserrat', body: 'Inter', label: '几何现代' },
];

export function CustomizePanel({ product, tier, onBack, onDone }: Props) {
  const { getActiveBrand, updateVI } = useBrandStore();
  const brand = getActiveBrand();

  // 微调状态
  const [brandName, setBrandName] = useState(brand?.name || product.logoText);
  const [hueShift, setHueShift] = useState(0);
  const [selectedFontIdx, setSelectedFontIdx] = useState(
    FONT_OPTIONS.findIndex(f => f.heading === product.fonts.heading) >= 0
      ? FONT_OPTIONS.findIndex(f => f.heading === product.fonts.heading)
      : 0
  );

  // 计算微调后的颜色
  const adjustedPrimary = hueShift === 0 ? product.primaryColor : shiftHue(product.primaryColor, hueShift);
  const adjustedSecondary = hueShift === 0 ? product.secondaryColor : shiftHue(product.secondaryColor, hueShift);
  const adjustedAccent = hueShift === 0 ? product.accentColor : shiftHue(product.accentColor, hueShift);
  const currentFont = FONT_OPTIONS[selectedFontIdx];

  // 色相偏移预设
  const huePresets = [
    { shift: 0, label: '原色' },
    { shift: -20, label: '偏暖' },
    { shift: 20, label: '偏冷' },
    { shift: -40, label: '暖色' },
    { shift: 40, label: '冷色' },
    { shift: 180, label: '互补' },
  ];

  const handleApply = () => {
    if (!brand) return;
    updateVI(brand.id, {
      source: 'market',
      colors: {
        primary: adjustedPrimary,
        secondary: adjustedSecondary,
        accent: adjustedAccent,
        neutral: product.neutralColor,
        background: product.bgColor,
      },
      fonts: {
        heading: currentFont.heading,
        body: currentFont.body,
      },
    });
    onDone();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full animate-fade-in">
      {/* 头部 */}
      <button onClick={onBack} className="flex items-center text-gray-400 hover:text-gray-900 mb-4 transition-colors text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        返回详情
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: adjustedPrimary }}>
          {brandName.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">微调你的 VI</h2>
          <p className="text-xs text-gray-400">已购买「{product.name}」{PRICE_TIERS[tier].name} · 以下微调全部免费</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧：实时预览 (3列) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Logo预览 */}
            <div className="h-56 flex flex-col items-center justify-center" style={{ backgroundColor: `${adjustedPrimary}08` }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl mb-3" style={{ backgroundColor: adjustedPrimary }}>
                {brandName.charAt(0)}
              </div>
              <div className="text-xl font-bold text-gray-900 tracking-wider" style={{ fontFamily: currentFont.heading }}>{brandName}</div>
              <div className="text-xs text-gray-400 mt-1">{product.subtitle}</div>
              <div className="flex gap-1.5 mt-4">
                {[adjustedPrimary, adjustedSecondary, adjustedAccent, product.neutralColor].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: c }}></div>
                ))}
              </div>
            </div>

            {/* 名片预览 */}
            <div className="p-6">
              <div className="text-xs font-bold text-gray-400 mb-3">📋 名片预览</div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: adjustedPrimary }}>
                    {brandName.charAt(0)}
                  </div>
                  <div className="font-bold text-sm" style={{ fontFamily: currentFont.heading, color: adjustedPrimary }}>{brandName}</div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-medium text-gray-700" style={{ fontFamily: currentFont.body }}>张三 / 创始人</div>
                  <div className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: currentFont.body }}>hello@{brandName.toLowerCase()}.com · 138-0000-0000</div>
                </div>
              </div>

              {/* 社交媒体预览 */}
              <div className="text-xs font-bold text-gray-400 mb-3 mt-6">📱 社交媒体头像</div>
              <div className="flex gap-3">
                {['微信', '小红书', '抖音'].map(platform => (
                  <div key={platform} className="text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-md mb-1" style={{ backgroundColor: adjustedPrimary }}>
                      {brandName.charAt(0)}
                    </div>
                    <div className="text-[10px] text-gray-400">{platform}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：调整面板 (2列) */}
        <div className="lg:col-span-2 space-y-5">
          {/* 品牌名 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="text-xs font-bold text-gray-700 mb-2 block">品牌名称</label>
            <input
              type="text"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-colors"
              placeholder="输入你的品牌名"
            />
          </div>

          {/* 色调微调 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="text-xs font-bold text-gray-700 mb-3 block">色调偏移</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {huePresets.map(preset => (
                <button
                  key={preset.shift}
                  onClick={() => setHueShift(preset.shift)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                    hueShift === preset.shift
                      ? 'bg-[#FF6B35]/10 border border-[#FF6B35] text-[#FF6B35] font-bold'
                      : 'bg-gray-50 border border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: shiftHue(product.primaryColor, preset.shift) }}></div>
                  {preset.label}
                </button>
              ))}
            </div>
            <div>
              <input
                type="range"
                min="-180"
                max="180"
                value={hueShift}
                onChange={e => setHueShift(Number(e.target.value))}
                className="w-full accent-[#FF6B35]"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>暖 ←</span>
                <span>{hueShift}°</span>
                <span>→ 冷</span>
              </div>
            </div>
          </div>

          {/* 字体选择 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <label className="text-xs font-bold text-gray-700 mb-3 block">字体组合</label>
            <div className="space-y-2">
              {FONT_OPTIONS.map((font, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFontIdx(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedFontIdx === idx
                      ? 'bg-[#FF6B35]/10 border border-[#FF6B35]'
                      : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-800" style={{ fontFamily: font.heading }}>{font.label}</div>
                    <div className="text-[10px] text-gray-400">{font.heading} + {font.body}</div>
                  </div>
                  {selectedFontIdx === idx && (
                    <svg className="w-4 h-4 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 应用按钮 */}
          <button
            onClick={handleApply}
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold rounded-xl hover:bg-[#ff8050] transition-colors shadow-lg shadow-[#FF6B35]/20 text-sm"
          >
            ✨ 应用到当前品牌
          </button>
          <p className="text-center text-[10px] text-gray-400">
            将覆盖当前品牌「{brand?.name || '未选择'}」的VI设置
          </p>

          {/* 升级提示 */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-600 mb-2">想要更多自由度？</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">轻度定制（完全自定义配色）</span>
                <span className="text-[#FF6B35] font-bold">+¥99</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">深度改造（AI重新演绎）</span>
                <span className="text-[#FF6B35] font-bold">+¥299</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
