/**
 * InputPanel - 图文创作左侧输入面板
 * 
 * 输入主题、选平台、选风格，一键生成
 */
import React, { useState } from 'react';
import { TargetPlatform, ArticleDraft, PLATFORM_LIST, STYLE_OPTIONS } from './types';

interface InputPanelProps {
  onGenerate: (topic: string, platforms: TargetPlatform[], style: string) => void;
  isGenerating: boolean;
  draft: ArticleDraft | null;
}

export function InputPanel({ onGenerate, isGenerating, draft }: InputPanelProps) {
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<TargetPlatform[]>(['wechat', 'xiaohongshu']);
  const [style, setStyle] = useState<string>('professional');
  const [extraRequirements, setExtraRequirements] = useState('');

  const togglePlatform = (p: TargetPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    const req = extraRequirements.trim() ? `${topic}\n要求：${extraRequirements}` : topic;
    onGenerate(req, selectedPlatforms, style);
  };

  return (
    <div className="w-[300px] border-r border-gray-100 bg-white flex flex-col shrink-0">
      {/* 标题 */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-bold text-gray-800">图文创作</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">AI 生成 · 自动配图 · 多平台适配</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-5">
        {/* 主题输入 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">创作主题</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="输入你想写的主题，比如：&#10;· 我们公司的新产品发布&#10;· 行业趋势分析&#10;· 客户成功案例"
            className="w-full h-[100px] px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 placeholder:text-gray-300 bg-gray-50/50"
          />
        </div>

        {/* 目标平台 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">目标平台</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_LIST.map(p => {
              const active = selectedPlatforms.includes(p.platform);
              return (
                <button
                  key={p.platform}
                  onClick={() => togglePlatform(p.platform)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border
                    ${active
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30'
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'
                    }`}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 内容风格 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">内容风格</label>
          <div className="flex flex-col gap-1.5">
            {STYLE_OPTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`text-left px-3 py-2 rounded-lg transition-all border
                  ${style === s.id
                    ? 'bg-[#FF6B35]/5 border-[#FF6B35]/20'
                    : 'bg-gray-50/50 border-transparent hover:bg-gray-50'
                  }`}
              >
                <div className={`text-[12px] font-medium ${style === s.id ? 'text-[#FF6B35]' : 'text-gray-600'}`}>{s.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 额外要求 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">补充要求（可选）</label>
          <textarea
            value={extraRequirements}
            onChange={e => setExtraRequirements(e.target.value)}
            placeholder="比如：突出性价比、加入数据对比..."
            className="w-full h-[60px] px-3 py-2 text-[12px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 placeholder:text-gray-300 bg-gray-50/50"
          />
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || selectedPlatforms.length === 0}
          className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all
            ${isGenerating || !topic.trim() || selectedPlatforms.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF6B35] to-[#FF9F1C] text-white hover:shadow-lg hover:shadow-orange-200/50 active:scale-[0.98]'
            }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              AI 生成中...
            </span>
          ) : '✨ 生成图文内容'}
        </button>
      </div>
    </div>
  );
}
