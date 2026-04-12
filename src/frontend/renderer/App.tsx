/**
 * App.tsx - 全屏工作台 + 悬浮 AI 对话框
 * 
 * 布局：Sidebar(80px) + 全宽工作台
 * AI 对话框悬浮在右下角，可折叠/展开，感知当前页面上下文
 */
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { FloatingChat, PageContext } from './components/FloatingChat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Publish } from './pages/Publish';
import { Settings } from './pages/Settings';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { BrandCenter } from './pages/BrandCenter';
import { AIWorkspace } from './pages/AIWorkspace';
import { ContentStudio } from './pages/ContentStudio';
import { VideoStudio } from './pages/VideoStudio';
import './styles/globals.css';

export type PageMode = 'brand_center' | 'ai_workspace' | 'content_studio' | 'video_studio' | 'knowledge' | 'publish' | 'settings';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageMode>('ai_workspace');
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const brandId = 'default_brand';

  const renderPage = () => {
    switch (currentPage) {
      case 'brand_center':   return <BrandCenter />;
      case 'ai_workspace':   return <AIWorkspace />;
      case 'content_studio': return <ContentStudio />;
      case 'video_studio':   return <VideoStudio />;
      case 'knowledge':      return <KnowledgeBase brandId={brandId} />;
      case 'publish':        return <Publish brandId={brandId} />;
      case 'settings':       return <Settings />;
      default: return <AIWorkspace />;
    }
  };

  const handleChatAction = (action: string, payload?: any) => {
    if (action === 'show_preview') {
      setCanvasItems(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'text_draft',
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
          data: payload,
        },
      ]);
      setCurrentPage('ai_workspace');
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans">
      {/* macOS 标题栏拖拽区 */}
      <div className="fixed top-0 left-0 right-0 h-[38px] z-50" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      {/* 侧边导航 */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* 全宽工作台 */}
      <main className="flex-1 overflow-hidden bg-[#F9FAFB] relative">
        {renderPage()}
      </main>

      {/* 悬浮 AI 对话框（AI 工作台自带对话面板，不重复显示） */}
      {currentPage !== 'ai_workspace' && currentPage !== 'content_studio' && currentPage !== 'video_studio' && (
        <FloatingChat
          currentPage={currentPage as PageContext}
          onAction={handleChatAction}
        />
      )}
    </div>
  );
}

export default App;
