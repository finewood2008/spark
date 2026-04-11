/**
 * PlatformSelector.tsx
 */
import React from 'react';

interface Platform {
  id: string;
  icon: string;
  label: string;
  desc: string;
}

const PLATFORMS: Platform[] = [
  { id: 'wechat',    icon: '公', label: '公众号', desc: '图文推送' },
  { id: 'xiaohongshu', icon: '红', label: '小红书', desc: '图文笔记' },
  { id: 'douyin',    icon: '抖', label: '抖音',   desc: '短视频脚本' },
  { id: 'weibo',     icon: '博', label: '微博',   desc: '热点短文' },
  { id: 'shipinhao', icon: '视', label: '视频号', desc: '竖版视频' },
  { id: 'zhihu',     icon: '知', label: '知乎',   desc: '专业回答' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function PlatformSelector({ value, onChange }: Props) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-subtle)', marginBottom: 8 }}>
        目标平台
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 4px',
              background: value === p.id ? 'var(--brand-glow)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${value === p.id ? 'var(--brand-ring)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'var(--ease)',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: value === p.id ? 'var(--brand)' : '#9ca3af' }}>{p.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: value === p.id ? 'var(--brand)' : 'var(--text-secondary)' }}>{p.label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{p.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
