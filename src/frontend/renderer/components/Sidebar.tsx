/**
 * Sidebar.tsx - 品牌级侧边导航
 * 
 * 白底 + 火花橙选中态 + 轻盈的线性图标
 * 温暖、干净、不抢内容区的注意力
 */
import React from 'react';
import { PageMode } from '../App';
import { IconWorkspace, IconBrand, IconMemory, IconPublish, IconSettings } from './Icons';

interface SidebarProps {
  currentPage: PageMode;
  onNavigate: (page: PageMode) => void;
}

const navItems = [
  { id: 'ai_workspace' as PageMode, Icon: IconWorkspace, label: '工作台' },
  { id: 'brand_center' as PageMode, Icon: IconBrand,     label: '品牌中心' },
  { id: 'knowledge'    as PageMode, Icon: IconMemory,     label: '品牌记忆' },
  { id: 'publish'      as PageMode, Icon: IconPublish,    label: '发布' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <nav className="w-[64px] bg-white border-r border-gray-100 flex flex-col items-center py-5 shrink-0 z-20">
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center cursor-pointer mb-8 hover:scale-105 transition-transform shadow-sm shadow-orange-200/50"
        title="Spark"
        onClick={() => onNavigate('ai_workspace')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" fill="white" opacity="0.95"/>
          <path d="M12 8c-2 3-3 5-3 7a3 3 0 006 0c0-2-1-4-3-7z" fill="white" opacity="0.4"/>
        </svg>
      </div>

      {/* 主导航 */}
      <div className="flex-1 flex flex-col gap-1 w-full px-2">
        {navItems.map(({ id, Icon, label }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`group relative w-full h-10 rounded-lg flex items-center justify-center transition-all duration-150
                ${active
                  ? 'bg-orange-50 text-[#FF6B35]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon size={18} />
              {/* 选中指示条 */}
              {active && (
                <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-[#FF6B35]" />
              )}
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部设置 */}
      <div className="w-full px-2">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full h-10 rounded-lg flex items-center justify-center transition-all duration-150
            ${currentPage === 'settings'
              ? 'bg-orange-50 text-[#FF6B35]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
        >
          <IconSettings size={18} />
        </button>
      </div>
    </nav>
  );
}
