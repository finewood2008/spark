/**
 * App.tsx - 全新双栏 Agent 结构
 */
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './pages/Chat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Brand } from './pages/Brand';
import { Publish } from './pages/Publish';
import { Settings } from './pages/Settings';
import './styles/globals.css';

import { CanvasWorkspace } from './components/CanvasWorkspace';

export type RightPanelMode = 'none' | 'preview' | 'knowledge' | 'brand' | 'publish' | 'settings';

export function App() {
  // 右侧面板状态
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('knowledge');
  // 维护画布上的所有对象元素（支持同时存在多个草稿或图片）
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  
  const brandId = 'default_brand';

  // 渲染右侧面板
  const renderRightPanel = () => {
    switch (rightPanel) {
      case 'knowledge': return <KnowledgeBase brandId={brandId} />;
      case 'brand':     return <Brand brandId={brandId} />;
      case 'publish':   return <Publish brandId={brandId} />;
      case 'settings':  return <Settings />;
      case 'preview':   
        return (
          <CanvasWorkspace 
             onClose={() => setRightPanel('none')} 
             items={canvasItems} 
             setItems={setCanvasItems} 
          />
        );
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans">
      {/* 最左侧极简导航条 */}
      <Sidebar currentPanel={rightPanel} onNavigate={setRightPanel} />
      
      {/* 中部/左侧：聊天主界面 */}
      <main className={`flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-200 bg-white ${rightPanel === 'none' ? 'w-[calc(100%-80px)]' : 'w-[450px] shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10'}`}>
        <Chat 
          brandId={brandId} 
          onShowPreview={(content) => {
            // 当 Agent 产生新内容时，将其作为一个新元素加入无限画布的中心附近
            setCanvasItems(prev => [
               ...prev, 
               {
                  id: Date.now().toString(),
                  type: 'text_draft',
                  x: Math.random() * 200 + 100, // 稍微随机偏移以免完全重叠
                  y: Math.random() * 200 + 100,
                  data: content
               }
            ]);
            setRightPanel('preview');
          }}
        />
      </main>

      {/* 右侧：工作台展示区 */}
      <aside className={`flex-1 transition-all duration-300 ease-in-out bg-[#F9FAFB] relative ${rightPanel === 'none' ? 'hidden' : 'block'}`}>
        {renderRightPanel()}
      </aside>
    </div>
  );
}

export default App;