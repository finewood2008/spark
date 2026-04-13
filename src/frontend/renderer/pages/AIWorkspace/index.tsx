/**
 * AIWorkspace v4 - 工作台（对话 + 无限画布合一）
 * 
 * 布局：左侧对话面板(320px) | 右侧无限画布
 * 画布卡片从下往上堆积：最新一批在最上面
 */
import React, { useState, useCallback, useRef } from 'react';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { InfiniteCanvas } from './InfiniteCanvas';
import {
  GenerationCard, GenerationType, ViewportState,
  QUICK_SCENES,
} from './types';

const DEMO_COLORS = [
  ['#FF6B35', '#FF9F1C'], ['#2EC4B6', '#0B8A8A'], ['#E71D36', '#FF6B6B'],
  ['#8338EC', '#3A86FF'], ['#011627', '#2EC4B6'], ['#FF006E', '#FB5607'],
  ['#FFBE0B', '#FF006E'], ['#3A86FF', '#8338EC'],
];

/** 生成中占位 SVG */
function generatingSvg(prompt: string, index: number, w: number, h: number): string {
  const [c1, c2] = DEMO_COLORS[index % DEMO_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:${c2};stop-opacity:0.3"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" rx="12" fill="url(#g${index})"/>
    <text x="${w/2}" y="${h/2-8}" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">AI 生成中...</text>
    <text x="${w/2}" y="${h/2+14}" text-anchor="middle" fill="#999" font-size="10" font-family="system-ui">${prompt.slice(0, 16)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/** 将 AI 返回的文案结果渲染为 SVG 卡片 */
function resultToSvg(title: string, content: string, tags: string[], index: number, w: number, h: number): string {
  const [c1, c2] = DEMO_COLORS[index % DEMO_COLORS.length];
  const lines = content.slice(0, 120).match(/.{1,20}/g) || [content.slice(0, 20)];
  const textLines = lines.slice(0, 4).map((line, i) =>
    `<text x="${w/2}" y="${h/2 + i * 18 - 10}" text-anchor="middle" fill="white" font-size="12" font-family="system-ui" opacity="0.85">${line}</text>`
  ).join('');
  const tagText = tags.length > 0 ? tags.slice(0, 3).map(t => `#${t}`).join(' ') : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="r${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" rx="12" fill="url(#r${index})"/>
    <text x="${w/2}" y="30" text-anchor="middle" fill="white" font-size="14" font-family="system-ui" font-weight="bold" opacity="0.95">${title.slice(0, 16)}</text>
    ${textLines}
    <text x="${w/2}" y="${h - 16}" text-anchor="middle" fill="white" font-size="9" font-family="system-ui" opacity="0.5">${tagText}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

const GAP = 24;

export function AIWorkspace() {
  const [cards, setCards] = useState<GenerationCard[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const [isGenerating, setIsGenerating] = useState(false);
  const cardCount = useRef(0);
  // 追踪下一行应该放的 Y 坐标（从 0 开始往下长，但视口会自动跟随）
  const nextY = useRef(40);

  const doGenerate = useCallback(async (type: GenerationType, prompt: string) => {
    const scene = QUICK_SCENES.find(s => s.id === type) || QUICK_SCENES[QUICK_SCENES.length - 1];
    const groupId = `group_${Date.now()}`;
    const { w, h } = scene.cardSize;

    setIsGenerating(true);

    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    }]);

    // 横排放置
    const startY = nextY.current;
    const positions: { x: number; y: number }[] = [];
    let x = 40;
    for (let i = 0; i < scene.batchCount; i++) {
      positions.push({ x, y: startY });
      x += w + GAP;
    }
    nextY.current = startY + h + GAP;

    // 先放占位卡片
    const newCards: GenerationCard[] = positions.map((pos, i) => {
      cardCount.current++;
      return {
        id: `card_${Date.now()}_${i}`,
        x: pos.x, y: pos.y,
        width: w, height: h,
        type, prompt,
        status: 'generating' as const,
        imageUrl: generatingSvg(prompt, i, w, h),
        title: `${scene.label} ${cardCount.current}`,
        createdAt: Date.now(),
        groupId,
      };
    });

    setCards(prev => [...prev, ...newCards]);

    // 调用真实 API
    try {
      if (window.spark?.workspace?.generate) {
        const res = await window.spark.workspace.generate({ prompt, type });

        if (res.success && res.data?.results) {
          const results: { title: string; content: string; tags: string[] }[] = res.data.results;
          const imageResults: { id: string; url: string }[] = [];

          newCards.forEach((card, i) => {
            const result = results[i % results.length];
            const url = resultToSvg(
              result.title || `方案 ${i + 1}`,
              result.content || '',
              result.tags || [],
              i, w, h
            );
            imageResults.push({ id: card.id, url });

            setCards(prev => prev.map(c =>
              c.id === card.id ? { ...c, status: 'done', imageUrl: url, title: result.title || c.title } : c
            ));
          });

          setMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            role: 'ai',
            content: `已生成 ${results.length} 个${scene.label}方案`,
            images: imageResults,
            timestamp: Date.now(),
          }]);
        } else {
          throw new Error(res.error || '生成失败');
        }
      } else if (window.spark?.agent?.chat) {
        // Fallback: agent:chat
        const res = await window.spark.agent.chat(prompt);
        const text = res.message || '';
        const imageResults: { id: string; url: string }[] = [];

        newCards.forEach((card, i) => {
          const url = resultToSvg(`方案 ${i + 1}`, text, [], i, w, h);
          imageResults.push({ id: card.id, url });
          setCards(prev => prev.map(c =>
            c.id === card.id ? { ...c, status: 'done', imageUrl: url } : c
          ));
        });

        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          role: 'ai',
          content: `已生成 ${newCards.length} 个${scene.label}方案`,
          images: imageResults,
          timestamp: Date.now(),
        }]);
      } else {
        throw new Error('未连接到 AI 服务');
      }
    } catch (err: any) {
      console.error('[AIWorkspace] 生成失败:', err);
      // 标记卡片为错误状态
      newCards.forEach(card => {
        setCards(prev => prev.map(c =>
          c.id === card.id ? { ...c, status: 'error' } : c
        ));
      });
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        role: 'ai',
        content: `生成失败：${err.message || '未知错误'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSend = useCallback((text: string) => {
    doGenerate('free', text);
  }, [doGenerate]);

  const handleQuickGenerate = useCallback((type: GenerationType, prompt: string) => {
    doGenerate(type, prompt);
  }, [doGenerate]);

  return (
    <div className="h-full flex">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        onQuickGenerate={handleQuickGenerate}
        isGenerating={isGenerating}
      />
      <div className="flex-1 relative min-w-0">
        <InfiniteCanvas
          cards={cards}
          viewport={viewport}
          onViewportChange={setViewport}
          onCardUpdate={(id, updates) => {
            setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
          }}
        />
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-300">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-[13px] text-gray-400 font-medium">在左侧开始创作</p>
              <p className="text-[11px] text-gray-300 mt-1">生成的内容会出现在画布上</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
