/**
 * KnowledgeBase.tsx - 品牌记忆
 * 
 * 火花对你品牌的理解中心：
 * - 顶部：品牌理解度仪表盘
 * - Tab1 资料库：品牌资料管理
 * - Tab2 火花笔记：火花从互动中学到的
 * - Tab3 关联图：品牌知识关联
 * - Tab4 数据连接：外部平台连接
 */
import React, { useState } from 'react';
import { TabVectorStore } from './KnowledgeBase/TabVectorStore';
import { TabMemoryLayers } from './KnowledgeBase/TabMemoryLayers';
import { TabKnowledgeGraph } from './KnowledgeBase/TabKnowledgeGraph';
import { TabDataSources } from './KnowledgeBase/TabDataSources';

interface Props { brandId: string; }

const TABS: { id: string; label: string }[] = [
  { id: 'vector',  label: '资料库' },
  { id: 'memory',  label: '火花笔记' },
  { id: 'graph',   label: '关联图' },
  { id: 'sources', label: '数据连接' },
];

// 模拟健康度数据
const HEALTH_DATA = {
  overall: 62,
  categories: [
    { name: '产品知识', coverage: 85, docs: 12, status: 'good' as const },
    { name: '品牌调性', coverage: 70, docs: 5, status: 'good' as const },
    { name: '客群画像', coverage: 45, docs: 3, status: 'warning' as const },
    { name: '竞品情报', coverage: 30, docs: 2, status: 'danger' as const },
    { name: '历史作品', coverage: 60, docs: 8, status: 'warning' as const },
    { name: '行业知识', coverage: 20, docs: 1, status: 'danger' as const },
  ],
  alerts: [
    { type: 'stale' as const, message: '竞品分析报告已过期 180 天', docId: '4' },
    { type: 'conflict' as const, message: '两份资料中目标客群描述不一致', docId: '2' },
    { type: 'gap' as const, message: '缺少定价策略相关知识', docId: '' },
  ],
  stats: {
    totalDocs: 31,
    totalVectors: 2847,
    lastUpdated: '2 小时前',
    memoryGrowth: '+12%',
  },
};

export function KnowledgeBase({ brandId }: Props) {
  const [tab, setTab] = useState('vector');

  const renderTab = () => {
    switch (tab) {
      case 'vector':  return <TabVectorStore brandId={brandId} />;
      case 'memory':  return <TabMemoryLayers brandId={brandId} />;
      case 'graph':   return <TabKnowledgeGraph brandId={brandId} />;
      case 'sources': return <TabDataSources brandId={brandId} />;
      default:        return <TabVectorStore brandId={brandId} />;
    }
  };

  const h = HEALTH_DATA;
  const overallColor = h.overall >= 70 ? 'text-green-600' : h.overall >= 40 ? 'text-amber-500' : 'text-red-500';
  const overallBg = h.overall >= 70 ? 'from-green-500 to-emerald-400' : h.overall >= 40 ? 'from-amber-400 to-orange-400' : 'from-red-500 to-rose-400';

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* 页头 */}
      <div className="px-8 py-5 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">品牌记忆</h1>
            <p className="text-xs text-gray-400 mt-0.5">火花越用越懂你的品牌</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20">
          + 添加资料
        </button>
      </div>

      {/* 健康度仪表盘 */}
      <div className="px-8 py-5 bg-white border-b border-gray-50 shrink-0">
        <div className="flex gap-5">
          {/* 总分 */}
          <div className="w-[180px] shrink-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-2">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="url(#healthGrad)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${h.overall * 2.136} 213.6`} />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={h.overall >= 70 ? '#22c55e' : h.overall >= 40 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={h.overall >= 70 ? '#10b981' : h.overall >= 40 ? '#f97316' : '#f43f5e'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${overallColor}`}>{h.overall}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500">品牌理解度</span>
          </div>

          {/* 知识覆盖率 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700">知识覆盖率</span>
              <span className="text-[10px] text-gray-400">{h.stats.totalDocs} 份资料 · 更新于 {h.stats.lastUpdated}</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {h.categories.map(cat => (
                <div key={cat.name} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-medium text-gray-700">{cat.name}</span>
                    <span className={`text-[10px] font-bold ${cat.status === 'good' ? 'text-green-600' : cat.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
                      {cat.coverage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cat.status === 'good' ? 'bg-green-500' : cat.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${cat.coverage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">{cat.docs} 篇文档</span>
                </div>
              ))}
            </div>
          </div>

          {/* 告警 */}
          <div className="w-[240px] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700">待处理</span>
              <span className="text-[10px] text-gray-400">{h.alerts.length} 项</span>
            </div>
            <div className="space-y-2">
              {h.alerts.map((alert, i) => (
                <div key={i} className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed border cursor-pointer hover:shadow-sm transition-all ${
                  alert.type === 'stale' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  alert.type === 'conflict' ? 'bg-red-50 border-red-100 text-red-600' :
                  'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                  <span className="font-medium">
                    {alert.type === 'stale' ? '过期' : alert.type === 'conflict' ? '冲突' : '缺失'}
                  </span>
                  <span className="ml-1">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="px-8 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-y-auto">
        {renderTab()}
      </div>
    </div>
  );
}
