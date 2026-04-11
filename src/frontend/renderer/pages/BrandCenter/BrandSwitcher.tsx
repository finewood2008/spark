/**
 * BrandSwitcher.tsx - 品牌切换器
 * 顶部下拉，支持切换/新建/删除品牌
 */
import React, { useState, useRef, useEffect } from 'react';
import { Brand } from '../../store/brandStore';

interface Props {
  brands: Brand[];
  activeBrandId: string | null;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => string;
  onDelete: (id: string) => void;
}

export function BrandSwitcher({ brands, activeBrandId, onSwitch, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = onCreate(newName.trim());
    onSwitch(id);
    setNewName('');
    setCreating(false);
    setOpen(false);
  };

  const activeBrand = brands.find(b => b.id === activeBrandId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors shadow-sm w-full max-w-md"
      >
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: activeBrand?.brandColor || '#FF6B35' }}>{(activeBrand?.name || 'B').charAt(0)}</span>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-gray-900">{activeBrand?.name || '选择品牌'}</div>
          <div className="text-[10px] text-gray-400">{brands.length} 个品牌 · 点击切换</div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉面板 */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {brands.map(brand => (
              <div
                key={brand.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group
                  ${brand.id === activeBrandId ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                onClick={() => { onSwitch(brand.id); setOpen(false); }}
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: brand.brandColor }}>{brand.name.charAt(0)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{brand.name}</div>
                  <div className="text-[10px] text-gray-400">完整度 {brand.completeness}%</div>
                </div>
                {brand.id === activeBrandId && (
                  <span className="text-[10px] font-bold text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded-full shrink-0">激活中</span>
                )}
                {brand.id !== activeBrandId && brands.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(brand.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
                    title="删除品牌"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 新建品牌 */}
          <div className="border-t border-gray-100 p-2">
            {creating ? (
              <div className="flex items-center gap-2 px-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="输入品牌名称..."
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] outline-none"
                />
                <button onClick={handleCreate} className="px-3 py-2 bg-[#FF6B35] text-white text-xs font-bold rounded-lg hover:bg-[#e85a20]">创建</button>
                <button onClick={() => { setCreating(false); setNewName(''); }} className="px-2 py-2 text-gray-400 text-xs hover:text-gray-600">取消</button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">+</span>
                新建品牌
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
