/**
 * Brand.tsx - 品牌视觉资产
 */
import React from 'react';

interface Props { brandId: string; }

const COLORS = [
  { name: '火焰橙', value: '#FF6B35', role: '主色调 / CTA' },
  { name: '深海蓝', value: '#1E3A5F', role: '品牌底色' },
  { name: '琥珀金', value: '#FFB347', role: '辅助强调' },
  { name: '极光白', value: '#F7F8F8', role: '文字 / 浅色背景' },
];

const FONTS = [
  { name: 'Noto Sans SC', role: '中文正文', weight: '400 / 500 / 700' },
  { name: 'Inter', role: '英文标题', weight: '300 / 500 / 600' },
];

export function Brand({ brandId }: Props) {
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-gradient-to-br from-orange-100 to-red-50 border-orange-200/50">🎨</span>
          <div>
            <div className="page-title">品牌视觉</div>
            <div className="page-subtitle">VI 规范库 · Spark 设计执行参考</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost">导出 PDF</button>
          <button className="btn btn-secondary text-[#FF6B35]">编辑规范</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        
        {/* 品牌定位 */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200"></span>
            品牌指南针
            <span className="flex-1 h-px bg-gray-200"></span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '品牌名称', value: '火花 Spark' },
              { label: '品类定位', value: 'AI 营销内容平台' },
              { label: '目标客群', value: '中小企业市场团队' },
              { label: '差异化', value: '品牌一致性 + AI 自动化' },
              { label: '品牌调性', value: '专业 · 温暖 · 有活力' },
              { label: '核心主张', value: '让每个企业都能做好设计' },
            ].map(item => (
              <div key={item.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-[15px] font-medium text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 色彩规范 */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200"></span>
            色彩系统
            <span className="flex-1 h-px bg-gray-200"></span>
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {COLORS.map(c => (
              <div key={c.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                <div 
                  className="h-24 w-full flex items-end justify-between p-3 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: c.value }}
                >
                  <span className={`text-xs font-bold font-mono ${c.value === '#F7F8F8' ? 'text-gray-500' : 'text-white/90'}`}>
                    {c.value}
                  </span>
                </div>
                <div className="p-3 bg-white relative z-10">
                  <div className="text-sm font-bold text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 字体规范 */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200"></span>
            排版与字体
            <span className="flex-1 h-px bg-gray-200"></span>
          </h3>
          <div className="flex flex-col gap-3">
            {FONTS.map(f => (
              <div key={f.name} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-3xl font-bold text-gray-900 w-48" style={{ fontFamily: f.name }}>{f.name}</div>
                  <div className="text-2xl text-gray-300">Aa</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-700">{f.role}</div>
                  <div className="text-[11px] text-gray-400 font-mono mt-1">w: {f.weight}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logo 资产 */}
        <section className="pb-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200"></span>
            Logo 资产
            <span className="flex-1 h-px bg-gray-200"></span>
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {['标准版 (浅色底)', '反白版 (深色底)', '单色图标'].map((variant, i) => (
              <div key={variant} className={`h-32 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-3 relative group ${i===1 ? 'bg-gray-900' : 'bg-white'}`}>
                <span className="text-4xl group-hover:scale-110 transition-transform">🔥</span>
                <span className={`text-[11px] font-medium absolute bottom-3 ${i===1 ? 'text-gray-400' : 'text-gray-400'}`}>{variant}</span>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-[1px] cursor-pointer">
                   <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">下载 SVG</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}