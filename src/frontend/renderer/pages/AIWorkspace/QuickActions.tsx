/**
 * QuickActions - 温暖的空状态引导
 * 
 * 画布空白时居中显示，用火花的语气引导用户
 * SVG 图标代替 emoji，暖色调贯穿
 */
import React from 'react';
import { QUICK_SCENES, GenerationType } from './types';

interface QuickActionsProps {
  onSelect: (type: GenerationType, prompt: string) => void;
  visible: boolean;
}

// 场景图标映射 — 统一线性风格
const SCENE_ICONS: Record<string, React.ReactNode> = {
  spark: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" />
    </svg>
  ),
  palette: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2" /><circle cx="17.5" cy="10.5" r="2" /><circle cx="8.5" cy="7.5" r="2" /><circle cx="6.5" cy="12" r="2" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-9-10-9z" />
    </svg>
  ),
  card: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  poster: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  phone: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  banner: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="2" /><path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" />
    </svg>
  ),
  vi: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  free: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
};

export function QuickActions({ onSelect, visible }: QuickActionsProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto max-w-xl w-full px-4">
        {/* 火花 Logo + 温暖问候 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center shadow-lg shadow-orange-200/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" fill="white" opacity="0.95"/>
              <path d="M12 8c-2 3-3 5-3 7a3 3 0 006 0c0-2-1-4-3-7z" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">你好，我是火花</h2>
          <p className="text-sm text-gray-400">选一个场景开始，或直接告诉我你想要什么</p>
        </div>

        {/* 场景网格 — 2行4列 */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_SCENES.map(scene => (
            <button
              key={scene.id}
              onClick={() => onSelect(scene.id, scene.defaultPrompt)}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#FF6B35]/40 hover:shadow-lg hover:shadow-orange-100/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B35] flex items-center justify-center group-hover:bg-[#FF6B35] group-hover:text-white transition-colors duration-200">
                {SCENE_ICONS[scene.icon] || scene.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{scene.label}</span>
              <span className="text-[10px] text-gray-400 leading-tight text-center">{scene.description}</span>
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-[11px] text-gray-300 mt-6">
          也可以直接在下方输入框描述你想要的
        </p>
      </div>
    </div>
  );
}
