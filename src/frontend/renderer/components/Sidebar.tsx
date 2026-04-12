/**
 * Sidebar.tsx - 品牌级侧边导航
 * 
 * 白底 + 火花橙选中态 + 轻盈的线性图标
 * 温暖、干净、不抢内容区的注意力
 */
import React from 'react';
import { PageMode } from '../App';
import { IconCanvas, IconContentStudio, IconVideo, IconBrand, IconMemory, IconPublish, IconSettings } from './Icons';
import sparkLogo from '../spark-logo.png';

interface SidebarProps {
  currentPage: PageMode;
  onNavigate: (page: PageMode) => void;
}

const navItems = [
  { id: 'ai_workspace'    as PageMode, Icon: IconCanvas,         label: '无限画布' },
  { id: 'content_studio'  as PageMode, Icon: IconContentStudio,  label: '图文创作' },
  { id: 'video_studio'    as PageMode, Icon: IconVideo,          label: '短视频' },
  { id: 'brand_center'    as PageMode, Icon: IconBrand,          label: '品牌中心' },
  { id: 'knowledge'       as PageMode, Icon: IconMemory,         label: '品牌记忆' },
  { id: 'publish'         as PageMode, Icon: IconPublish,        label: '发布' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <nav className="w-[64px] bg-white border-r border-gray-100 flex flex-col items-center shrink-0 z-20">
      {/* 红绿灯占位区 — macOS hiddenInset 模式下留出空间 */}
      <div className="h-[52px] shrink-0" />

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
