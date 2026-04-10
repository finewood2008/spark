/**
 * Sidebar.tsx - 重新设计的侧边极简导航栏 (类 Notion / Cursor)
 */
import React from 'react';
import { RightPanelMode } from '../App';

interface SidebarProps {
  currentPanel: RightPanelMode;
  onNavigate: (panel: RightPanelMode) => void;
}

const navItems = [
  { id: 'none'      as RightPanelMode, icon: '💬', label: '专注聊天' },
  { id: 'preview'   as RightPanelMode, icon: '✨', label: '工作台' },
  { id: 'knowledge' as RightPanelMode, icon: '📚', label: '记忆库' },
  { id: 'brand'     as RightPanelMode, icon: '🎨', label: '品牌视觉' },
  { id: 'publish'   as RightPanelMode, icon: '🚀', label: '发布管道' },
];

export function Sidebar({ currentPanel, onNavigate }: SidebarProps) {
  return (
    <nav className="w-[80px] bg-white border-r border-gray-100 flex flex-col items-center py-6 shrink-0 z-20">
      {/* Logo / Agent Avatar */}
      <div 
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center text-white font-bold text-xl shadow-md mb-8 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
        title="Spark"
      >
        S
      </div>

      {/* Main Nav */}
      <div className="flex-1 flex flex-col gap-4 w-full px-3">
        {navItems.map(item => {
          const isActive = currentPanel === item.id || (item.id === 'none' && currentPanel === 'none');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-orange-50 text-[#FF6B35] shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }
              `}
            >
              {item.icon}
              {/* Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="w-full px-3 mt-auto">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all
            ${currentPanel === 'settings' 
              ? 'bg-gray-100 text-gray-900 shadow-sm' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            }
          `}
        >
          ⚙️
        </button>
      </div>
    </nav>
  );
}