/**
 * GenCard v2 - 品牌级生成卡片
 * 
 * 去掉 emoji，用 SVG 图标
 * 骨架屏更精致，hover 操作更克制
 */
import React from 'react';
import { GenerationCard } from './types';
import { IconDownload, IconRefresh } from '../../components/Icons';

interface GenCardProps {
  card: GenerationCard;
  onClick?: () => void;
}

export function GenCard({ card, onClick }: GenCardProps) {
  return (
    <div
      className="absolute group"
      style={{
        left: card.x,
        top: card.y,
        width: card.width,
        height: card.height,
      }}
      onClick={onClick}
    >
      <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60 cursor-pointer">
        {/* 生成中 — 骨架屏 */}
        {card.status === 'generating' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="relative w-10 h-10 mb-3">
              <div className="absolute inset-0 rounded-full border-[1.5px] border-gray-200" />
              <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#FF6B35] animate-spin" />
            </div>
            <div className="text-[11px] text-gray-500 font-medium">生成中</div>
            <div className="text-[10px] text-gray-400 mt-1 max-w-[80%] text-center truncate">{card.prompt}</div>
          </div>
        )}

        {/* 生成完成 — 图片 */}
        {card.status === 'done' && card.imageUrl && (
          <div className="relative w-full h-full">
            <img
              src={card.imageUrl}
              alt={card.title || card.prompt}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* 悬浮信息 */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {card.title && (
                <div className="text-white text-[11px] font-medium mb-0.5">{card.title}</div>
              )}
              <div className="text-white/60 text-[10px] truncate">{card.prompt}</div>
            </div>
            {/* 操作按钮 */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white transition-colors" title="下载">
                <IconDownload size={12} />
              </button>
              <button className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white transition-colors" title="重新生成">
                <IconRefresh size={12} />
              </button>
            </div>
          </div>
        )}

        {/* 生成失败 */}
        {card.status === 'error' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 mb-2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div className="text-[11px] text-red-500 font-medium">生成失败</div>
            <button className="mt-2 px-3 py-1 bg-red-100/80 text-red-600 text-[10px] rounded-md hover:bg-red-200/80 transition-colors font-medium">
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
