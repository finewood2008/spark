/**
 * ChatPanel — 通用对话面板
 * 
 * 消息列表贴底（自下往上），底部输入框
 * 支持悬浮快捷气泡 + 初始选项卡
 */
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './types';
import { ChatBubble } from './ChatBubble';

/** 快捷气泡 */
export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
}

/** 初始选项卡 */
export interface StarterCard {
  title: string;
  desc: string;
  options: QuickAction[];
}

interface ChatPanelProps {
  title: string;
  subtitle: string;
  icon?: string;           // 头像文字，默认"火"
  accentColor?: string;    // 主题色，默认 #FF6B35
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onSelect: (messageId: string, selected: string[]) => void;
  onConfirm: (messageId: string, confirmed: boolean) => void;
  onAction?: (messageId: string, actionId: string) => void;
  onQuickAction?: (actionId: string) => void;
  quickActions?: QuickAction[];     // 悬浮快捷气泡
  starterCard?: StarterCard;        // 初始选项卡（无消息时显示）
  inputPlaceholder?: string;
  inputDisabled?: boolean;
  typing?: boolean;
}

export function ChatPanel({
  title, subtitle, icon = '火', accentColor = '#FF6B35',
  messages, onSend, onSelect, onConfirm, onAction, onQuickAction,
  quickActions, starterCard,
  inputPlaceholder = '输入你的想法...', inputDisabled = false, typing = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showStarter, setShowStarter] = useState(true);

  // 有用户消息后隐藏 starter
  useEffect(() => {
    if (messages.some(m => m.role === 'user')) {
      setShowStarter(false);
    }
  }, [messages]);

  // 自动滚到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || inputDisabled) return;
    onSend(text);
    setInput('');
    setShowStarter(false);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setShowStarter(false);
    onQuickAction?.(action.id);
  };

  // 计算渐变色
  const gradientFrom = accentColor;
  const gradientTo = accentColor === '#FF6B35' ? '#FF9F1C' : accentColor + 'CC';

  return (
    <div className="w-[320px] border-r border-gray-100 bg-white flex flex-col shrink-0">
      {/* 标题栏 */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-gray-800">{title}</h2>
            <p className="text-[10px] text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* 消息列表 — 贴底布局 */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 flex flex-col justify-end">
        <div className="py-4">
          {/* 初始选项卡 — 无用户消息时显示 */}
          {showStarter && starterCard && messages.filter(m => m.role === 'user').length === 0 && (
            <div className="mb-4">
              {/* 火花消息 */}
              {messages.filter(m => m.role === 'spark').map(msg => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  onSelect={onSelect}
                  onConfirm={onConfirm}
                  onAction={onAction}
                  accentColor={accentColor}
                  avatarIcon={icon}
                />
              ))}

              {/* 选项卡 */}
              <div
                className="mt-3 rounded-2xl p-4 border"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04)`,
                  borderColor: `${accentColor}15`,
                }}
              >
                <div className="text-[13px] font-bold text-gray-700 mb-1">{starterCard.title}</div>
                <div className="text-[11px] text-gray-400 mb-3">{starterCard.desc}</div>
                <div className="space-y-1.5">
                  {starterCard.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleQuickAction(opt)}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all group"
                      style={{ ['--accent' as any]: accentColor }}
                    >
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="text-sm">{opt.icon}</span>}
                        <span className="text-[12px] text-gray-600 group-hover:text-gray-800 font-medium">{opt.label}</span>
                        <svg className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 正常消息流 — 有用户消息后显示 */}
          {!showStarter && messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onSelect={onSelect}
              onConfirm={onConfirm}
              onAction={onAction}
              accentColor={accentColor}
              avatarIcon={icon}
            />
          ))}

          {/* 正在输入指示器 */}
          {typing && (
            <div className="flex justify-start mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 mr-2"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
              >
                {icon}
              </div>
              <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 悬浮快捷气泡 */}
      {quickActions && quickActions.length > 0 && !inputDisabled && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all hover:shadow-sm"
              style={{
                background: `${accentColor}08`,
                borderColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={inputDisabled}
            rows={1}
            className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-2xl resize-none focus:outline-none placeholder:text-gray-300 bg-gray-50/50 disabled:opacity-50"
            style={{
              minHeight: '40px',
              maxHeight: '100px',
              ['--tw-ring-color' as any]: `${accentColor}30`,
            }}
            onFocus={e => {
              e.target.style.borderColor = accentColor;
              e.target.style.boxShadow = `0 0 0 2px ${accentColor}15`;
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || inputDisabled}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
            style={{
              background: input.trim() && !inputDisabled ? accentColor : '#f3f4f6',
              color: input.trim() && !inputDisabled ? 'white' : '#d1d5db',
              boxShadow: input.trim() && !inputDisabled ? `0 4px 12px ${accentColor}30` : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
