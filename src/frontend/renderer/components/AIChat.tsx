/**
 * AIChat.tsx
 */
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  ts: Date;
}

const QUICK_ACTIONS = [
  '写一篇产品推广文案',
  '生成节日活动海报文字',
  '写品牌故事开篇',
  '做竞品对比分析',
  '写用户证言文案',
];

interface Props {
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
}

export function AIChat({ onGenerate, isGenerating }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: '你好，我是火花。告诉我你想创作什么，我来帮你。',
      ts: new Date(),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (text: string) => {
    if (!text.trim() || isGenerating) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    onGenerate(text);

    // 模拟 AI 回复
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `正在为你生成「${text}」的内容，请稍候…`,
        ts: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className="fade-in"
            style={{
              display: 'flex',
              gap: 8,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'ai'
                ? 'linear-gradient(135deg, var(--brand), var(--gold))'
                : 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}>
              {msg.role === 'ai' ? 'S' : 'U'}
            </div>
            <div style={{
              maxWidth: '75%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
              background: msg.role === 'user' ? 'var(--brand-glow)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'var(--brand-ring)' : 'var(--border-subtle)'}`,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700 }}>S</div>
            <div style={{ padding: '8px 12px', borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', fontSize: 13 }}>
              <span className="loading-pulse">正在生成…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 快捷操作 */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {QUICK_ACTIONS.map(a => (
          <button
            key={a}
            onClick={() => handleSubmit(a)}
            style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'var(--ease)',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--brand-ring)'; (e.target as HTMLElement).style.color = 'var(--brand)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.target as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* 输入框 */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="告诉我想创作什么… (Enter 发送)"
          rows={2}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'var(--ease)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 2px var(--brand-ring)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={isGenerating || !input.trim()}
          style={{
            width: 40, height: 40,
            background: isGenerating || !input.trim() ? 'rgba(255,107,53,0.3)' : 'var(--brand)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontSize: 16,
            cursor: isGenerating || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--ease)',
            flexShrink: 0,
          }}
        >
          {isGenerating ? '⟳' : '↑'}
        </button>
      </div>
    </div>
  );
}
