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

export type RightPanelMode = 'none' | 'preview' | 'knowledge' | 'brand' | 'publish' | 'settings';

export function App() {
  // 右侧面板状态
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('knowledge');
  // 当前在右侧预览的内容（如生成好的文案对象）
  const [previewContent, setPreviewContent] = useState<any>(null);
  
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
          <div className="h-full flex flex-col bg-white/50">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0">
               <h2 className="text-lg font-bold text-gray-800">内容预览工作室</h2>
               <button onClick={() => setRightPanel('none')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
               </button>
             </div>
             <div className="flex-1 p-6 overflow-y-auto">
                {previewContent ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
                    <div className="mb-6 flex justify-between items-center">
                      <span className="px-3 py-1 bg-orange-100 text-[#FF6B35] text-sm font-bold rounded-lg uppercase tracking-wider">
                        {previewContent.platform || '小红书'} 草稿
                      </span>
                      <button className="text-sm font-medium text-gray-500 hover:text-[#FF6B35] flex items-center space-x-1">
                        <span>⎘</span> <span>一键复制</span>
                      </button>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">{previewContent.title}</h1>
                    <div className="prose prose-orange max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {previewContent.body}
                    </div>
                    {previewContent.hashtags && previewContent.hashtags.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                        {previewContent.hashtags.map((tag: string) => (
                          <span key={tag} className="text-sm text-blue-600 font-medium">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    在左侧和 Alex 沟通，他生成的内容将显示在这里
                  </div>
                )}
             </div>
          </div>
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
            setPreviewContent(content);
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