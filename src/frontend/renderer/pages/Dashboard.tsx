/**
 * Dashboard.tsx - 工作台
 */
import React, { useState } from 'react';
import { AIChat } from '../components/AIChat';
import { PlatformSelector } from '../components/PlatformSelector';
import { ContentPreview } from '../components/ContentPreview';

interface GeneratedContent {
  id: string;
  title: string;
  body: string;
  platform: string;
  score: number;
}

interface Props {
  brandId: string;
}

export function Dashboard({ brandId }: Props) {
  const [platform, setPlatform] = useState('wechat');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (topic: string) => {
    setIsGenerating(true);
    try {
      // 模拟内容生成（实际由 Agent IPC 处理）
      // await window.spark?.content?.generate?.({ topic, platform });
      setTimeout(() => {
        setContent({
          id: Date.now().toString(),
          title: topic,
          body: `这是一篇关于「${topic}」的专业内容示例。\n\n核心价值主张清晰，结合品牌调性和目标平台特性，帮助你高效触达目标用户。\n\n火花 AI 会根据你的品牌风格和历史高表现内容进行定制化生成，每一篇都符合品牌一致性。`,
          platform,
          score: 0.88 + Math.random() * 0.1,
        });
        setIsGenerating(false);
      }, 1500);
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 头部 */}
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-orange-50 text-[#FF6B35]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          <div>
            <div className="page-title">内容工作台</div>
            <div className="page-subtitle">AI 驱动的品牌内容创作</div>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost">历史</button>
          <button className="btn btn-ghost">⊕ 模板</button>
        </div>
      </div>

      {/* 主区域 */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0, overflow: 'hidden' }}>
        {/* 左侧：平台 + 对话 */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <PlatformSelector value={platform} onChange={setPlatform} />
          <AIChat onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>

        {/* 右侧：预览 */}
        <div style={{ overflow: 'hidden' }}>
          {content ? (
            <ContentPreview content={content} />
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-icon text-[#FF6B35]"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z"/></svg></div>
              <div className="empty-title">等待创作指令</div>
              <div className="empty-desc">在左侧输入内容主题，AI 将立即为你生成符合品牌调性的专业文案</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
