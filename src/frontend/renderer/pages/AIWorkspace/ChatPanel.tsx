/**
 * ChatPanel v5 - 品牌级对话面板
 * 
 * 设计语言：
 * - 深色头部，与 Sidebar 呼应
 * - 建议用图标+文字卡片，不用 emoji
 * - 对话气泡更克制，用品牌色点缀
 * - 输入框精致，有呼吸感
 */
import React, { useState, useRef, useEffect } from 'react';
import { GenerationType } from './types';
import { IconSend, IconSparkle, IconImage, IconPalette, IconLayout } from '../../components/Icons';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  images?: { id: string; url: string }[];
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onQuickGenerate: (type: GenerationType, prompt: string) => void;
  isGenerating: boolean;
}

const SUGGESTIONS = [
  { label: 'Logo',   sub: '4 个方案', type: 'logo' as GenerationType,          prompt: '为品牌设计一个简约现代的 Logo', icon: 'spark' },
  { label: '配色',   sub: '品牌色板', type: 'color_palette' as GenerationType,  prompt: '生成一套温暖专业的品牌配色方案', icon: 'palette' },
  { label: '名片',   sub: '正反面',   type: 'business_card' as GenerationType,  prompt: '设计一张简约大气的商务名片',     icon: 'layout' },
  { label: '海报',   sub: '3 版',     type: 'poster' as GenerationType,         prompt: '设计一张品牌宣传海报',           icon: 'image' },
  { label: '封面',   sub: '社交媒体', type: 'social_cover' as GenerationType,   prompt: '生成小红书风格的品牌封面图',     icon: 'image' },
  { label: '全套VI', sub: '一键生成', type: 'brand_board' as GenerationType,    prompt: '生成完整的品牌视觉识别系统',     icon: 'spark' },
];

function SuggestionIcon({ type }: { type: string }) {
  switch (type) {
    case 'spark':   return <IconSparkle size={12} />;
    case 'palette': return <IconPalette size={12} />;
    case 'layout':  return <IconLayout size={12} />;
    case 'image':   return <IconImage size={12} />;
    default:        return <IconSparkle size={12} />;
  }
}

export function ChatPanel({ messages, onSend, onQuickGenerate, isGenerating }: ChatPanelProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="w-[320px] shrink-0 bg-[#FAFAFA] border-r border-gray-200/60 flex flex-col h-full">
      {/* 头部 — 深色，与 sidebar 呼应 */}
      <div className="px-4 py-3.5 bg-white border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z" fill="white" opacity="0.95"/>
          </svg>
        </div>
        <span className="text-[13px] font-medium text-gray-800 tracking-wide">Spark</span>
        <span className="text-[10px] text-gray-400 ml-auto">Brand AI</span>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-end min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF9F1C]/10 flex items-center justify-center mb-4">
              <IconSparkle size={20} className="text-[#FF6B35]" />
            </div>
            <p className="text-sm text-gray-600 font-medium">开始创作</p>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
              选择下方场景快速生成<br/>或直接描述你的需求
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-[#FF6B35] text-white rounded-2xl rounded-br-md'
                  : 'bg-white text-gray-700 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                }`}
              >
                <p>{msg.content}</p>
                {msg.images && msg.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                    {msg.images.map(img => (
                      <div key={img.id} className="rounded-lg overflow-hidden aspect-square bg-gray-100">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-gray-400">生成中</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 建议卡片 — 在输入框上方 */}
      <div className="px-3 py-2.5 border-t border-gray-200/40">
        <div className="grid grid-cols-3 gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s.type}
              onClick={() => onQuickGenerate(s.type, s.prompt)}
              disabled={isGenerating}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-white border border-gray-100 hover:border-[#FF6B35]/30 hover:bg-[#FF6B35]/[0.03] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="text-gray-400 group-hover:text-[#FF6B35] transition-colors">
                <SuggestionIcon type={s.icon} />
              </span>
              <span className="text-[11px] text-gray-600 font-medium leading-none">{s.label}</span>
              <span className="text-[9px] text-gray-400 leading-none">{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 输入框 */}
      <div className="px-3 py-3 border-t border-gray-200/40">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200/60 focus-within:border-[#FF6B35]/30 focus-within:shadow-sm transition-all">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="描述你想要的设计..."
            className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0
              ${text.trim()
                ? 'bg-[#FF6B35] text-white hover:bg-[#e85a20]'
                : 'text-gray-300'}`}
          >
            <IconSend size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
