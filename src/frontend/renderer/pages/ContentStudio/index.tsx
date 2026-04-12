/**
 * ContentStudio - 图文创作模块
 * 
 * 三栏布局：左侧输入 | 中间编辑 | 右侧多平台预览
 * 核心流程：输入主题 → AI生成图文 → 手动修改 → 预览各平台效果 → 推送发布
 */
import React, { useState, useCallback } from 'react';
import { ContentChatPanel } from './ContentChatPanel';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { ArticleDraft, ContentBlock, TargetPlatform } from './types';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 占位 SVG（等待真实图片生成时显示） */
function placeholderSvg(prompt: string, w = 680, h = 380): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="12" fill="#f3f4f6"/>
    <text x="${w/2}" y="${h/2-8}" text-anchor="middle" fill="#9ca3af" font-size="14" font-family="system-ui">AI 配图生成中...</text>
    <text x="${w/2}" y="${h/2+14}" text-anchor="middle" fill="#d1d5db" font-size="11" font-family="system-ui">${(prompt || '').slice(0, 30)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/** 调用真实 API 生成图文 */
async function generateContent(
  topic: string, platforms: TargetPlatform[], style: string
): Promise<ArticleDraft> {
  // 尝试调用 IPC（Electron 环境）
  if (window.spark?.content?.generate) {
    const res = await window.spark.content.generate({
      topic,
      platforms,
      style,
    });

    if (res.success && res.data) {
      const data = res.data;
      const blocks: ContentBlock[] = (data.blocks || []).map((b: any) => ({
        id: uid(),
        type: b.type || 'text',
        content: b.type === 'image' ? placeholderSvg(b.imagePrompt || '') : (b.content || ''),
        imagePrompt: b.imagePrompt,
        generating: b.type === 'image',
      }));

      return {
        id: uid(),
        title: data.title || `${topic.slice(0, 30)}`,
        blocks,
        coverPrompt: data.coverPrompt,
        platforms,
        style: style as ArticleDraft['style'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    // API 调用失败，抛出错误让上层处理
    throw new Error(res.error || 'AI 生成失败');
  }

  // Fallback: 走 agent:chat 通用对话
  if (window.spark?.agent?.chat) {
    const prompt = `请为我生成一篇关于"${topic}"的${style}风格图文内容，目标平台：${platforms.join('、')}。要求包含标题、3-5个段落、配图描述。`;
    const res = await window.spark.agent.chat(prompt);
    const text = res.message || res.data?.body || '';
    return {
      id: uid(),
      title: res.data?.title || `${topic.slice(0, 30)}`,
      blocks: [{ id: uid(), type: 'text', content: text }],
      platforms,
      style: style as ArticleDraft['style'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  throw new Error('未连接到 AI 服务');
}

export function ContentStudio() {
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async (topic: string, platforms: TargetPlatform[], style: string) => {
    setIsGenerating(true);
    try {
      const result = await generateContent(topic, platforms, style);
      setDraft(result);

      // 图片 block 标记为 generating，后续可接真实图片生成 API
      // 目前先用占位图，3秒后标记完成
      result.blocks.forEach((block, i) => {
        if (block.type === 'image') {
          setTimeout(() => {
            setDraft(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                blocks: prev.blocks.map(b =>
                  b.id === block.id ? { ...b, generating: false } : b
                ),
              };
            });
          }, 1500 + i * 500);
        }
      });

      // 封面占位
      if (result.coverPrompt) {
        setTimeout(() => {
          const coverUrl = placeholderSvg(result.coverPrompt || '', 800, 340);
          setDraft(prev => prev ? { ...prev, coverImage: coverUrl } : prev);
        }, 1000);
      }

    } catch (err: any) {
      console.error('[ContentStudio] 生成失败:', err);
      // 生成失败时给用户一个提示 draft
      setDraft({
        id: uid(),
        title: '生成失败',
        blocks: [{ id: uid(), type: 'text', content: `AI 生成出错：${err.message || '未知错误'}，请稍后重试。` }],
        platforms,
        style: style as ArticleDraft['style'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleUpdateTitle = useCallback((title: string) => {
    setDraft(prev => prev ? { ...prev, title, updatedAt: Date.now() } : prev);
  }, []);

  const handleUpdateBlock = useCallback((blockId: string, content: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b => b.id === blockId ? { ...b, content } : b),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const handleRegenerateImage = useCallback((blockId: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId ? { ...b, generating: true } : b
        ),
      };
    });
    // 模拟重新生成
    setTimeout(() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="380" viewBox="0 0 680 380">
        <rect width="680" height="380" rx="12" fill="#E71D36"/>
        <text x="340" y="190" text-anchor="middle" fill="white" font-size="16" font-family="system-ui">重新生成的配图</text>
      </svg>`;
      const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      setDraft(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map(b =>
            b.id === blockId ? { ...b, content: url, generating: false } : b
          ),
        };
      });
    }, 2000);
  }, []);

  const handleAddBlock = useCallback((type: 'text' | 'image', afterId?: string) => {
    const newBlock: ContentBlock = {
      id: uid(),
      type,
      content: '',
    };
    setDraft(prev => {
      if (!prev) return prev;
      if (!afterId) {
        return { ...prev, blocks: [...prev.blocks, newBlock], updatedAt: Date.now() };
      }
      const idx = prev.blocks.findIndex(b => b.id === afterId);
      const blocks = [...prev.blocks];
      blocks.splice(idx + 1, 0, newBlock);
      return { ...prev, blocks, updatedAt: Date.now() };
    });
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== blockId),
        updatedAt: Date.now(),
      };
    });
  }, []);

  const handleRegenerateCover = useCallback(() => {
    // 模拟重新生成封面
    setDraft(prev => prev ? { ...prev, coverImage: undefined } : prev);
    setTimeout(() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="340" viewBox="0 0 800 340">
        <defs><linearGradient id="cover2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8338EC"/><stop offset="100%" style="stop-color:#3A86FF"/>
        </linearGradient></defs>
        <rect width="800" height="340" fill="url(#cover2)"/>
        <text x="400" y="170" text-anchor="middle" fill="white" font-size="20" font-family="system-ui" font-weight="bold">新封面</text>
      </svg>`;
      const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      setDraft(prev => prev ? { ...prev, coverImage: url } : prev);
    }, 1500);
  }, []);

  const handlePushToPublish = useCallback((platform: TargetPlatform) => {
    // TODO: 推送到发布模块
    console.log('Push to publish:', platform);
  }, []);

  const handlePushAllToPublish = useCallback(() => {
    // TODO: 推送所有平台到发布模块
    console.log('Push all to publish');
  }, []);

  return (
    <div className="h-full flex">
      <ContentChatPanel
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      <EditorPanel
        draft={draft}
        onUpdateTitle={handleUpdateTitle}
        onUpdateBlock={handleUpdateBlock}
        onRegenerateImage={handleRegenerateImage}
        onAddBlock={handleAddBlock}
        onDeleteBlock={handleDeleteBlock}
        onRegenerateCover={handleRegenerateCover}
      />
      <PreviewPanel
        draft={draft}
        onPushToPublish={handlePushToPublish}
        onPushAllToPublish={handlePushAllToPublish}
      />
    </div>
  );
}
