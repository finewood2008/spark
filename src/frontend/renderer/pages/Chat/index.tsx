/**
 * Chat.tsx - Agent 聊天区 (左侧主操作区)
 */
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'content_card' | 'onboarding';
  data?: any;
}

interface ChatProps {
  brandId: string;
  onShowPreview: (content: any) => void;
}

export function Chat({ brandId, onShowPreview }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'agent',
      type: 'onboarding',
      content: '嗨！初次见面，我是 **Alex**。从今天起，我就是你们团队的专属数字营销专家（也就是你的 CMO）。\n\n我的主要工作是：\n1. 学习并记住我们品牌的调性和产品知识\n2. 创作高转化文案、设计品牌物料\n3. 根据你的修改反馈，不断进化我的风格\n\n**你可以直接在下面向我下达工作指令，比如：“帮我写一篇关于咖啡的初夏上新小红书。”**',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // @ts-ignore
      const res = await window.spark.agent.chat(userMessage.content);
      
      let agentMsg: Message = { id: (Date.now()+1).toString(), role: 'agent', content: res.message || '' };
      
      if (res.type === 'content') {
         agentMsg.type = 'content_card';
         agentMsg.data = res.data;
         agentMsg.content = '我已经为您准备好了第一版文案草稿。你看一下这种语气合适吗？如果有需要修改的地方直接告诉我，我下次就会记住。';
         
         // 自动在右侧工作区打开
         onShowPreview(res.data);
      }

      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'agent', content: '哎呀，系统网络好像开小差了，稍等我调整一下再试。' }]);
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

  const renderMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部状态栏 */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6B35] to-[#FF9F1C] flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none mb-1">Alex (CMO)</h2>
            <p className="text-[11px] font-medium text-gray-500">Spark 智能体 · 就绪状态</p>
          </div>
        </div>
      </div>

      {/* 对话流 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* 文本内容 */}
              {msg.content && (
                <div className={`rounded-2xl px-4 py-3 shadow-sm text-[14px] leading-relaxed break-words
                  ${msg.role === 'user' 
                    ? 'bg-[#FF6B35] text-white rounded-br-sm ml-auto' 
                    : 'bg-[#F9FAFB] text-gray-700 rounded-tl-sm border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{renderMarkdownText(msg.content)}</p>
                </div>
              )}
              
              {/* 选项卡片 (针对预设问题或选择) */}
              {msg.role === 'agent' && msg.content.includes('你可以直接在下面向我下达工作指令') && (
                <div className="mt-3 flex flex-wrap gap-2 max-w-sm">
                   {['帮我写一篇初夏上新推文', '为我设计一张端午节海报', '润色这篇品牌故事'].map(act => (
                     <button 
                       key={act}
                       onClick={() => { setInput(act); setTimeout(handleSend, 100); }}
                       className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 rounded-full hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                     >
                       {act}
                     </button>
                   ))}
                </div>
              )}
              
              {/* 生成内容展现卡片 (简略版，大版在右侧) */}
              {msg.type === 'content_card' && msg.data && (
                  <div className="mt-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-[#FF6B35]/30 group" onClick={() => onShowPreview(msg.data)}>
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded">{msg.data.platform} 草稿</span>
                          <span className="text-xs text-gray-400 group-hover:text-[#FF6B35] transition-colors">在工作台查看 →</span>
                      </div>
                      <h4 className="font-bold text-[15px] text-gray-900 mb-1 line-clamp-1">{msg.data.title}</h4>
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{msg.data.body}</p>
                  </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading */}
        {isLoading && (
            <div className="flex flex-col items-start animate-fade-in">
              <div className="bg-[#F9FAFB] rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 flex space-x-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 底部输入框 */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 shrink-0">
        <div className="relative group shadow-sm rounded-2xl border border-gray-200 bg-[#F9FAFB] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#FF6B35] focus-within:border-[#FF6B35] transition-all flex flex-col">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="指派任务给 Alex..."
            className="w-full resize-none bg-transparent border-none px-4 pt-3.5 pb-2 focus:ring-0 text-sm text-gray-800 placeholder-gray-400 min-h-[80px] max-h-[200px]"
            style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <div className="flex justify-between items-center px-2 pb-2">
            <div className="flex space-x-1">
              <button 
                onClick={() => {
                   // 模拟上传参考图，将文件名加入输入框
                   setInput(prev => prev + (prev ? '\n' : '') + '[附图: 参考竞品海报.png] ');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors tooltip-trigger" 
                title="上传参考资料/图片"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors tooltip-trigger" title="调用品牌知识库">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-1.5 rounded-xl transition-all ${!input.trim() || isLoading ? 'bg-gray-200 text-gray-400' : 'bg-[#FF6B35] text-white shadow-md hover:bg-[#e85a20] hover:scale-105'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400">Shift + Enter 换行，Enter 发送</span>
        </div>
      </div>
    </div>
  );
}