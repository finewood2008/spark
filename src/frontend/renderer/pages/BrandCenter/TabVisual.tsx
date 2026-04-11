/**
 * TabVisual.tsx - 视觉资产 Tab
 * 
 * 展示当前品牌的 VI：Logo / 配色 / 字体 / 图形规范
 * 三条路径入口：上传已有 VI / 去超市买 / AI 生成
 */
import React, { useState } from 'react';
import { Brand, useBrandStore } from '../../store/brandStore';

interface Props {
  brand: Brand;
}

export function TabVisual({ brand }: Props) {
  const { updateVI } = useBrandStore();
  const vi = brand.vi;
  const hasVI = vi.source !== 'none';
  const [editingColor, setEditingColor] = useState<string | null>(null);

  // 如果还没有 VI，显示三条路径入口
  if (!hasVI) {
    return (
      <div className="p-8 max-w-3xl mx-auto w-full animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35]"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-9-10-9z"/></svg></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">还没有视觉资产</h2>
          <p className="text-sm text-gray-500 mb-10 max-w-md mx-auto">
            品牌的视觉形象是用户对你的第一印象。选择一种方式来建立你的 VI 体系：
          </p>

          <div className="grid grid-cols-3 gap-6">
            {/* 上传已有 VI */}
            <button
              onClick={() => updateVI(brand.id, { source: 'uploaded' })}
              className="group bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#FF6B35] p-8 transition-all hover:shadow-lg hover:-translate-y-1 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
              <div className="text-sm font-bold text-gray-900 mb-1">上传已有 VI</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">已有设计师做好的 Logo、配色方案？直接上传导入</div>
            </button>

            {/* 去超市买 */}
            <button
              className="group bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#FF6B35] p-8 transition-all hover:shadow-lg hover:-translate-y-1 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35] mx-auto mb-4 group-hover:scale-110 transition-transform"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
              <div className="text-sm font-bold text-gray-900 mb-1">从超市购买</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">浏览专业设计师的成套 VI 方案，一键导入使用</div>
            </button>

            {/* AI 生成 */}
            <button
              onClick={() => updateVI(brand.id, { source: 'ai_generated' })}
              className="group bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#FF6B35] p-8 transition-all hover:shadow-lg hover:-translate-y-1 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mx-auto mb-4 group-hover:scale-110 transition-transform"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z"/></svg></div>
              <div className="text-sm font-bold text-gray-900 mb-1">AI 智能生成</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">基于品牌字典信息，AI 自动生成一套完整 VI</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 有 VI 时展示完整视觉资产
  const colorEntries = [
    { key: 'primary',    label: '主色调',   role: 'CTA / 品牌标识' },
    { key: 'secondary',  label: '辅助色',   role: '标题 / 深色背景' },
    { key: 'accent',     label: '强调色',   role: '高亮 / 装饰' },
    { key: 'neutral',    label: '中性色',   role: '正文 / 辅助文字' },
    { key: 'background', label: '背景色',   role: '页面底色' },
  ] as const;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      {/* 来源标记 */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500 uppercase">
          {vi.source === 'uploaded' ? '用户上传' : vi.source === 'market' ? '超市购买' : 'AI 生成'}
        </span>
        <button
          onClick={() => updateVI(brand.id, { source: 'none' })}
          className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
        >
          重置 VI
        </button>
      </div>

      {/* Logo 资产 */}
      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200"></span>
          Logo 资产
          <span className="flex-1 h-px bg-gray-200"></span>
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '标准版（浅色底）', bg: 'bg-white', textColor: 'text-gray-400' },
            { label: '反白版（深色底）', bg: 'bg-gray-900', textColor: 'text-gray-500' },
            { label: '单色图标', bg: 'bg-gray-50', textColor: 'text-gray-400' },
          ].map((variant, i) => (
            <div key={i} className={`h-36 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-3 relative group ${variant.bg} cursor-pointer hover:shadow-md transition-all`}>
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center group-hover:scale-110 transition-transform"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" fill="white" opacity="0.95"/></svg></span>
              <span className={`text-[11px] font-medium ${variant.textColor}`}>{variant.label}</span>
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800 shadow-sm">上传 / 替换</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 色彩系统 */}
      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200"></span>
          色彩系统
          <span className="flex-1 h-px bg-gray-200"></span>
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {colorEntries.map(c => {
            const colorValue = vi.colors[c.key];
            return (
              <div key={c.key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                <div
                  className="h-20 w-full flex items-end p-3 transition-transform group-hover:scale-105 cursor-pointer relative"
                  style={{ backgroundColor: colorValue }}
                  onClick={() => setEditingColor(editingColor === c.key ? null : c.key)}
                >
                  <span className={`text-[10px] font-bold font-mono ${colorValue === '#F9FAFB' || colorValue === '#F7F8F8' ? 'text-gray-500' : 'text-white/80'}`}>
                    {colorValue}
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-gray-800">{c.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{c.role}</div>
                </div>
                {editingColor === c.key && (
                  <div className="px-3 pb-3">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={e => updateVI(brand.id, { colors: { ...vi.colors, [c.key]: e.target.value } })}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 字体系统 */}
      <section>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-gray-200"></span>
          字体系统
          <span className="flex-1 h-px bg-gray-200"></span>
        </h3>
        <div className="space-y-3">
          {[
            { key: 'heading' as const, label: '标题字体', sample: 'The quick brown fox 敏捷的棕色狐狸' },
            { key: 'body' as const, label: '正文字体', sample: 'The quick brown fox 敏捷的棕色狐狸' },
          ].map(f => (
            <div key={f.key} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-2xl font-bold text-gray-900 w-40" style={{ fontFamily: vi.fonts[f.key] }}>
                  {vi.fonts[f.key]}
                </div>
                <div className="text-lg text-gray-300" style={{ fontFamily: vi.fonts[f.key] }}>
                  {f.sample}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-700">{f.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 导出 */}
      <section className="pb-10">
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
            导出 VI 规范手册 (PDF)
          </button>
          <button className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            导出资产包 (ZIP)
          </button>
        </div>
      </section>
    </div>
  );
}
