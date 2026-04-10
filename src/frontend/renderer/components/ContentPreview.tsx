/**
 * ContentPreview.tsx
 */
import React from 'react';

interface GeneratedContent {
  id: string;
  title: string;
  body: string;
  platform: string;
  score: number;
}

const PLATFORM_LABELS: Record<string, { icon: string; name: string }> = {
  wechat:       { icon: '💬', name: '公众号' },
  xiaohongshu:  { icon: '📕', name: '小红书' },
  douyin:       { icon: '🎵', name: '抖音' },
  weibo:        { icon: '🌐', name: '微博' },
  shipinhao:    { icon: '📹', name: '视频号' },
  zhihu:        { icon: '❓', name: '知乎' },
};

interface Props {
  content: GeneratedContent;
}

export function ContentPreview({ content }: Props) {
  const p = PLATFORM_LABELS[content.platform] ?? { icon: '📄', name: content.platform };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部元信息 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}>
        <span style={{ fontSize: 18 }}>{p.icon}</span>
        <span className="badge badge-default">{p.name}</span>
        <span className="badge badge-success">
          ★ {(content.score * 100).toFixed(0)} 分
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => navigator.clipboard?.writeText(content.body)}>
          复制
        </button>
        <button className="btn btn-primary" style={{ fontSize: 11 }}>
          发布
        </button>
      </div>

      {/* 内容正文 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 16, lineHeight: 1.4 }}>
          {content.title}
        </h2>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {content.body}
        </div>
      </div>

      {/* 底部操作 */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 8, background: 'var(--bg-panel)',
      }}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>重新生成</button>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>调整风格</button>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>存入草稿</button>
      </div>
    </div>
  );
}
