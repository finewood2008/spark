/**
 * EditorPanel - 图文编辑区
 * 
 * 中间主编辑区：标题 + 内容块（文字/图片交替）
 * 支持手动修改文案、重新生成配图
 */
import React, { useState } from 'react';
import { ArticleDraft, ContentBlock } from './types';
import { IconRefresh, IconImage } from '../../components/Icons';

interface EditorPanelProps {
  draft: ArticleDraft | null;
  onUpdateTitle: (title: string) => void;
  onUpdateBlock: (blockId: string, content: string) => void;
  onRegenerateImage: (blockId: string) => void;
  onAddBlock: (type: 'text' | 'image', afterId?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onRegenerateCover: () => void;
}

export function EditorPanel({
  draft, onUpdateTitle, onUpdateBlock, onRegenerateImage,
  onAddBlock, onDeleteBlock, onRegenerateCover,
}: EditorPanelProps) {
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);

  if (!draft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-gray-500">在左侧输入主题开始创作</p>
          <p className="text-[11px] text-gray-400 mt-1">AI 会自动生成图文内容并配图</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-[680px] mx-auto py-8 px-6">
        {/* 封面图 */}
        <div className="relative group mb-6 rounded-xl overflow-hidden bg-gray-100 aspect-[2/1]">
          {draft.coverImage ? (
            <img src={draft.coverImage} alt="封面" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="text-center">
                <IconImage size={24} className="mx-auto text-gray-300 mb-2" />
                <span className="text-[12px] text-gray-400">AI 生成封面图</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={onRegenerateCover}
              className="px-3 py-1.5 bg-white/90 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <IconRefresh size={12} /> 重新生成封面
            </button>
          </div>
        </div>

        {/* 标题 */}
        <input
          type="text"
          value={draft.title}
          onChange={e => onUpdateTitle(e.target.value)}
          placeholder="输入标题..."
          className="w-full text-[22px] font-bold text-gray-800 bg-transparent border-none outline-none placeholder:text-gray-300 mb-6"
        />

        {/* 内容块 */}
        <div className="flex flex-col gap-4">
          {draft.blocks.map((block, idx) => (
            <div
              key={block.id}
              className={`group relative rounded-xl transition-all ${focusedBlock === block.id ? 'ring-1 ring-[#FF6B35]/30' : ''}`}
              onFocus={() => setFocusedBlock(block.id)}
              onBlur={() => setFocusedBlock(null)}
            >
              {block.type === 'text' ? (
                <textarea
                  value={block.content}
                  onChange={e => onUpdateBlock(block.id, e.target.value)}
                  placeholder="输入文案内容..."
                  className="w-full min-h-[80px] px-4 py-3 text-[14px] leading-relaxed text-gray-700 bg-white border border-gray-100 rounded-xl resize-none focus:outline-none focus:border-[#FF6B35]/30 placeholder:text-gray-300"
                  style={{ height: 'auto' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = t.scrollHeight + 'px';
                  }}
                />
              ) : block.type === 'image' ? (
                <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  {block.generating ? (
                    <div className="aspect-[16/9] flex items-center justify-center">
                      <div className="text-center">
                        <svg className="animate-spin h-6 w-6 mx-auto text-[#FF6B35] mb-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        <span className="text-[11px] text-gray-400">AI 配图生成中...</span>
                      </div>
                    </div>
                  ) : block.content ? (
                    <img src={block.content} alt="配图" className="w-full" />
                  ) : (
                    <div className="aspect-[16/9] flex items-center justify-center">
                      <span className="text-[12px] text-gray-400">点击生成配图</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => onRegenerateImage(block.id)}
                      className="p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white"
                      title="重新生成"
                    >
                      <IconRefresh size={12} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <hr className="border-gray-200 my-2" />
              )}

              {/* 块操作 */}
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <button
                  onClick={() => onDeleteBlock(block.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}

          {/* 添加块 */}
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => onAddBlock('text')}
              className="px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              + 文字
            </button>
            <button
              onClick={() => onAddBlock('image')}
              className="px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              + 配图
            </button>
            <button
              onClick={() => onAddBlock('text')}
              className="px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              + 分割线
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
