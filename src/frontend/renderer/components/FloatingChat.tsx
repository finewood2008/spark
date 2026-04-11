/**
 * FloatingChat.tsx - 全局悬浮 AI 对话框
 * 
 * 设计理念：
 * - 右下角悬浮气泡，点击展开对话面板
 * - 感知当前页面上下文（通过 currentPage prop）
 * - 可折叠/展开，不遮挡工作台操作
 * - 支持拖拽调整位置（后续）
 */
import React, { useState, useRef, useEffect } from 'react';

export type PageContext = 'brand_center' | 'preview' | 'ai_workspace' | 'knowledge' | 'publish' | 'settings';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'content_card';
  data?: any;
}

interface FloatingChatProps {
  currentPage: PageContext;
  onAction?: (action: string, payload?: any) => void;
}

const PAGE_HINTS: Record<PageContext, string> = {
  brand_center: '我看到你在品牌中心，需要帮你填写品牌字典、调整配色，还是挑选 VI 方案？',
  ai_workspace: 'AI 工作台模式，左侧对话框直接描述你想要的，我来帮你生成图片到画布上。',
  preview: '画布模式，我可以帮你调整画布上的内容，或者生成新的设计草稿。',
  knowledge: '记忆库页面，需要我帮你整理品牌知识、导入资料吗？',
  publish: '发布管道，我可以帮你检查内容规范、适配不同平台格式。',
  settings: '设置页面，有什么配置上的问题可以问我。',
};

export function FloatingChat({ currentPage, onAction }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: '嗨，我是 Alex，你的 AI 营销助手。随时可以找我聊，我会根据你当前在做的事情来帮你。',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevPage = useRef(currentPage);

  // 页面切换时，自动发一条上下文提示
  useEffect(() => {
    if (prevPage.current !== currentPage) {
      prevPage.current = currentPage;
      const hint = PAGE_HINTS[currentPage];
      if (hint) {
        const contextMsg: Message = {
          id: `ctx_${Date.now()}`,
          role: 'agent',
          content: hint,
        };
        setMessages(prev => [...prev, contextMsg]);
        if (!isOpen) setHasUnread(true);
      }
    }
  }, [currentPage, isOpen]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 展开时聚焦输入框
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // @ts-ignore
      const res = await window.spark?.agent?.chat?.(userMsg.content);
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: res?.message || '收到，让我想想怎么帮你处理这个。',
      };
      if (res?.type === 'content') {
        agentMsg.type = 'content_card';
        agentMsg.data = res.data;
        onAction?.('show_preview', res.data);
      }
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'agent', content: '网络开小差了，稍后再试。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setHasUnread(false);
  };

  // ---- 气泡按钮（收起状态）----
  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
        </svg>
        {/* 未读红点 */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl">
          问问 Alex
        </span>
      </button>
    );
  }

  // ---- 展开的对话面板 ----
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${isMinimized ? 'w-[360px] h-[56px]' : 'w-[400px] h-[560px]'}`}>
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF9F1C] text-white cursor-pointer shrink-0 select-none"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold backdrop-blur-sm">
            A
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Alex</div>
            {!isMinimized && <div className="text-[10px] text-white/70 mt-0.5">AI 营销助手 · 在线</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* 最小化 */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d={isMinimized ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"} />
            </svg>
          </button>
          {/* 关闭 */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 对话区域（最小化时隐藏） */}
      {!isMinimized && (
        <>
          {/* 当前页面上下文标签 */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
            <span className="text-[10px] font-medium text-gray-400">
              当前页面：
              <span className="text-gray-600 ml-1">
                {{ brand_center: '品牌中心', ai_workspace: 'AI 工作台', preview: '画布', knowledge: '记忆库', publish: '发布管道', settings: '设置' }[currentPage]}
              </span>
            </span>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-[#FF6B35] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-700 rounded-tl-sm'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷操作 */}
          <div className="px-3 py-1.5 border-t border-gray-50 shrink-0 flex gap-1.5 overflow-x-auto">
            {currentPage === 'brand_center' && (
              <>
                <button onClick={() => setInput('帮我补齐品牌字典')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">补齐字典</button>
                <button onClick={() => setInput('推荐一套配色方案')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">推荐配色</button>
                <button onClick={() => setInput('帮我写一句 Slogan')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">写 Slogan</button>
              </>
            )}
            {currentPage === 'publish' && (
              <>
                <button onClick={() => setInput('帮我写一篇小红书推文')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">写小红书</button>
                <button onClick={() => setInput('帮我写一篇公众号文章')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">写公众号</button>
              </>
            )}
            {currentPage === 'preview' && (
              <button onClick={() => setInput('帮我生成一张海报')} className="shrink-0 px-2.5 py-1 bg-orange-50 text-[#FF6B35] text-[11px] font-medium rounded-full hover:bg-orange-100 transition-colors">生成海报</button>
            )}
          </div>

          {/* 输入框 */}
          <div className="px-3 pb-3 pt-1 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#FF6B35] focus-within:bg-white transition-all px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问问 Alex..."
                rows={1}
                className="flex-1 bg-transparent border-none resize-none text-sm text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none min-h-[24px] max-h-[80px] py-0"
                style={{ overflowY: input.split('\n').length > 2 ? 'auto' : 'hidden' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${!input.trim() || isLoading
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-[#FF6B35] text-white hover:bg-[#e85a20]'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
