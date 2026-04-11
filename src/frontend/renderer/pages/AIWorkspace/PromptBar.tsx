/**
 * PromptBar - 底部生成输入栏
 * 
 * 始终悬浮在画布底部，简洁的生成入口
 * 左侧场景快捷按钮 + 中间输入框 + 右侧发送
 */
import React, { useState, useRef, useEffect } from 'react';
import { QUICK_SCENES, GenerationType } from './types';

interface PromptBarProps {
  onGenerate: (type: GenerationType, prompt: string) => void;
  isGenerating: boolean;
  generatingCount: number;
}

export function PromptBar({ onGenerate, isGenerating, generatingCount }: PromptBarProps) {
  const [text, setText] = useState('');
  const [showScenes, setShowScenes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭场景菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowScenes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = () => {
    const prompt = text.trim();
    if (!prompt) return;
    onGenerate('free', prompt);
    setText('');
  };

  const handleSceneClick = (type: GenerationType, defaultPrompt: string) => {
    const prompt = text.trim() || defaultPrompt;
    onGenerate(type, prompt);
    setText('');
    setShowScenes(false);
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/80 p-2 flex items-center gap-2">
        {/* 场景选择按钮 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowScenes(!showScenes)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all
              ${showScenes ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="选择生成类型"
          >
            +
          </button>

          {/* 场景弹出菜单 */}
          {showScenes && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-56">
              {QUICK_SCENES.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneClick(scene.id, scene.defaultPrompt)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-left"
                >
                  <span className="text-lg">{scene.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{scene.label}</div>
                    <div className="text-[10px] text-gray-400">{scene.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="描述你想要的图片，或点 + 选择场景..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none px-2"
        />

        {/* 生成中计数 */}
        {generatingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg">
            <div className="w-3 h-3 rounded-full border-2 border-transparent border-t-[#FF6B35] animate-spin" />
            <span className="text-[11px] text-[#FF6B35] font-medium">{generatingCount}</span>
          </div>
        )}

        {/* 发送按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
            ${text.trim()
              ? 'bg-[#FF6B35] text-white hover:bg-[#e55a2b] shadow-sm'
              : 'bg-gray-100 text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
