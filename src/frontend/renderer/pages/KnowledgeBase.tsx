/**
 * KnowledgeBase.tsx - 记忆库
 */
import React, { useState } from 'react';

interface Doc {
  id: string;
  type: string;
  title: string;
  preview: string;
  date: string;
  tags: string[];
}

const MOCK_DOCS: Doc[] = [
  { id: '1', type: '品牌资料', title: '火花品牌故事', preview: '从一个想法到一个平台，我们相信每个中小企业都值得拥有专业的品牌...', date: '2024-12', tags: ['品牌', '故事'] },
  { id: '2', type: '产品信息', title: '核心功能介绍', preview: 'AI 内容生成、多平台适配、品牌一致性管理是火花的三大核心能力...', date: '2024-12', tags: ['功能', '产品'] },
  { id: '3', type: '高表现案例', title: '小红书爆款笔记模板', preview: '标题公式：痛点+解决方案+数字，正文结构：钩子+价值+行动...', date: '2024-11', tags: ['小红书', '模板'] },
  { id: '4', type: '竞品分析', title: '行业竞品对比报告', preview: '目前市场上主要竞品包括某某某，在功能上我们的差异化在于...', date: '2024-11', tags: ['分析', '竞品'] },
];

const TABS = ['全部', '品牌资料', '产品信息', '高表现案例', '竞品分析'];

interface Props { brandId: string; }

export function KnowledgeBase({ brandId }: Props) {
  const [tab, setTab] = useState('全部');
  const [search, setSearch] = useState('');

  const filtered = MOCK_DOCS.filter(d =>
    (tab === '全部' || d.type === tab) &&
    (d.title.includes(search) || d.preview.includes(search))
  );

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-blue-50 text-blue-500 border-blue-100">📚</span>
          <div>
            <div className="page-title">记忆库</div>
            <div className="page-subtitle">RAG 向量检索 · Agent 的大脑知识源</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary shadow-blue-500/20 bg-blue-500 hover:bg-blue-600">⊕ 投喂资料</button>
        </div>
      </div>

      <div className="px-8 pt-4 pb-0 bg-white border-b border-gray-100">
        <div className="relative max-w-md mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="搜索知识..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          {TABS.map(t => (
            <button 
              key={t} 
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`} 
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-4">📭</span>
            <p>未检索到相关记忆</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {doc.type}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{doc.date}</span>
                </div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-2">{doc.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                  {doc.preview}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {doc.tags.map(t => (
                    <span key={t} className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">#{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}