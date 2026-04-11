/**
 * CanvasWorkspace.tsx - 无限画布工作台
 * 采用类似 Figma / Miro 的拖拽缩放设计，用于展示生成的文案和设计的图片素材
 */
import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';

interface CanvasItem {
  id: string;
  type: 'text_draft' | 'image_asset';
  x: number;
  y: number;
  width?: number | string;
  data: any;
}

interface WorkspaceProps {
  onClose: () => void;
  items: CanvasItem[];
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
}

export function CanvasWorkspace({ onClose, items, setItems }: WorkspaceProps) {
  // 画布缩放和平移状态
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 处理画布拖拽（按住空格或者鼠标中键/右键时拖动画布）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.altKey) {
      setIsPanning(true);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    document.body.style.cursor = 'default';
  };

  // 处理滚轮缩放
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale(prev => {
        const newScale = prev - e.deltaY * 0.005;
        return Math.min(Math.max(newScale, 0.1), 3); // 限制缩放 10% - 300%
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (canvas) canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // 处理用户在画板上要求修改图片
  const handleImageEdit = async (item: CanvasItem, command: string) => {
    // 模拟大模型/后端处理图片的过程，这里为了演示，我们将请求发送给左侧的 Chat 或者直接调用某个专门的 image 接口
    // 在真正的生产环境中，这里应该是发送到你的 python 后端，带上原图的 base64 和用户的 prompt。
    
    // 我们将其添加到画板的提示中
    const loadingId = Date.now().toString();
    setItems(prev => [
      ...prev,
      {
        id: loadingId,
        type: 'text_draft',
        x: item.x + 300,
        y: item.y,
        data: {
          title: `正在处理：${command}`,
          body: `正在呼叫 AI 视觉模型处理该图片...\n原图 ID: ${item.id}\n指令: ${command}`,
          platform: 'AI 视觉'
        }
      }
    ]);

    try {
      // 这里的逻辑：实际上你应该把它通过 IPC 发给你的模型
      // const result = await window.spark.agent.editImage(item.data.url, command);
      
      setTimeout(() => {
        setItems(prev => prev.map(i => {
           if (i.id === loadingId) {
              return {
                 ...i,
                 type: 'image_asset',
                 data: { url: item.data.url } // 模拟处理完的图片，为了演示直接返回原图
              };
           }
           return i;
        }));
      }, 2000);
      
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F3F4F6] relative overflow-hidden">
      
      {/* 顶部工具栏 */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-4 pointer-events-auto">
          <div className="flex items-center space-x-2 border-r border-gray-100 pr-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z"/></svg>
            <div>
              <h2 className="text-[13px] font-bold text-gray-800 leading-none">无限创作工坊</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">可拖拽素材 · 本地图片处理</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
             <button 
               onClick={async () => {
                 // @ts-ignore
                 const base64 = await window.spark.dialog.openImage();
                 if (base64) {
                    setItems(prev => [...prev, {
                       id: Date.now().toString(),
                       type: 'image_asset',
                       x: pan.x * -1 + 200, // 放置在当前视野中间
                       y: pan.y * -1 + 200,
                       width: 300,
                       data: { url: base64 }
                    }]);
                 }
               }}
               className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors tooltip" title="上传本地图片"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
             </button>
             <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="画笔工具">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-2.81 1.053a.75.75 0 01-.98-.98l1.053-2.81a4.5 4.5 0 011.147-1.89L16.862 4.487zm0 0L19.5 7.125" /></svg>
             </button>
             <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="添加文本">
               <span className="font-serif font-bold text-sm px-1">T</span>
             </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-2 text-xs font-medium text-gray-600">
             <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="hover:text-[#FF6B35]">-</button>
             <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="hover:text-[#FF6B35]">+</button>
             <div className="w-px h-3 bg-gray-200 mx-1"></div>
             <button onClick={() => { setScale(1); setPan({x:0, y:0}); }} className="hover:text-[#FF6B35]">还原</button>
          </div>
          <button onClick={onClose} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 无限画布区域 (带点阵背景) */}
      <div 
        ref={canvasRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
        style={{
          backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)',
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          {items.map((item, index) => (
            <Rnd
              key={item.id}
              default={{ x: item.x, y: item.y, width: item.width || 400, height: 'auto' }}
              minWidth={200}
              bounds="parent"
              enableUserSelectHack={false}
              className={`bg-white rounded-2xl shadow-xl border ${item.type === 'image_asset' ? 'border-[#FF6B35]/50' : 'border-gray-200/80'} overflow-hidden group`}
              dragHandleClassName="drag-handle"
              onDragStop={(e, d) => {
                const newItems = [...items];
                newItems[index].x = d.x;
                newItems[index].y = d.y;
                setItems(newItems);
              }}
            >
              {/* 卡片头部拖拽把手 */}
              <div className="drag-handle bg-gray-50/50 backdrop-blur-sm px-4 py-2 border-b border-gray-100 flex justify-between items-center cursor-move">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF6B35]"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {item.type === 'text_draft' ? '智能草稿' : '视觉资产'}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                   <button className="text-gray-400 hover:text-blue-500 p-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                   <button className="text-gray-400 hover:text-red-500 p-1">×</button>
                </div>
              </div>

              {/* 卡片内容渲染 */}
              {item.type === 'text_draft' && (
                <div className="p-6 cursor-text">
                   <h3 className="text-lg font-bold text-gray-900 mb-3">{item.data.title}</h3>
                   <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap outline-none focus:ring-2 focus:ring-[#FF6B35]/30 rounded px-1 -mx-1" contentEditable suppressContentEditableWarning>
                     {item.data.body}
                   </div>
                   {item.data.hashtags && (
                     <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-1.5">
                       {item.data.hashtags.map((tag: string) => (
                         <span key={tag} className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">#{tag}</span>
                       ))}
                     </div>
                   )}
                </div>
              )}

              {item.type === 'image_asset' && (
                <div className="p-0 relative group/img">
                  <img src={item.data.url} alt="Generated Asset" className="w-full h-auto block" draggable={false} />
                  {/* 图片上的悬浮操作栏 (大模型功能入口) */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-gray-900/80 backdrop-blur-md px-3 py-2 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity">
                     <button onClick={() => handleImageEdit(item, '智能抠图')} className="text-white text-xs hover:text-[#FFB347] flex flex-col items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>抠图</button>
                     <div className="w-px h-6 bg-white/20"></div>
                     <button onClick={() => handleImageEdit(item, 'AI 画面延伸扩图')} className="text-white text-xs hover:text-[#FFB347] flex flex-col items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>扩图</button>
                     <div className="w-px h-6 bg-white/20"></div>
                     <button onClick={() => {
                       const prompt = window.prompt('请输入你想对这张图片做的修改指令（例如：把背景变成海滩）：');
                       if (prompt) handleImageEdit(item, prompt);
                     }} className="text-white text-xs hover:text-[#FFB347] flex flex-col items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></svg>AI 魔法</button>
                  </div>
                </div>
              )}
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
}