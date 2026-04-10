/**
 * Publish.tsx - 发布管理
 */
import React, { useState } from 'react';

const MOCK_ITEMS = [
  { id: '1', platform: '小红书', icon: '📕', title: '秋冬护肤必备 5 款产品', status: 'published', time: '10分钟前', score: 94 },
  { id: '2', platform: '公众号', icon: '💬', title: '品牌故事：从零到一的创业历程', status: 'scheduled', time: '明天 09:00', score: 88 },
  { id: '3', platform: '抖音',   icon: '🎵', title: '产品使用教程｜3 分钟学会', status: 'draft', time: '草稿', score: 76 },
  { id: '4', platform: '微博',   icon: '🌐', title: '双十一大促来了！限时优惠', status: 'failed', time: '1小时前', score: 0 },
];

const STATUS_MAP = {
  published: { label: '已发布', class: 'badge-success' },
  scheduled: { label: '已排期', class: 'badge-brand' },
  draft:     { label: '草稿',   class: 'badge-default' },
  failed:    { label: '发布失败', class: 'badge-warning' },
} as const;

const TABS = ['全部', '已发布', '已排期', '草稿'];

interface Props { brandId: string; }

export function Publish({ brandId }: Props) {
  const [tab, setTab] = useState('全部');

  const filtered = MOCK_ITEMS.filter(i =>
    tab === '全部' ||
    (tab === '已发布' && i.status === 'published') ||
    (tab === '已排期' && i.status === 'scheduled') ||
    (tab === '草稿' && i.status === 'draft')
  );

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">🚀</span>
          <div>
            <div className="page-title">发布管道</div>
            <div className="page-subtitle">多平台内容分发 · 排期管理</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost">📅 日历</button>
          <button className="btn btn-primary">⊕ 新建</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
        {filtered.map(item => {
          const s = STATUS_MAP[item.status as keyof typeof STATUS_MAP];
          return (
            <div key={item.id} className="card group hover:border-[#FF6B35]/30 cursor-pointer transition-all flex items-center p-4 gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-gray-800 mb-1 truncate">{item.title}</div>
                <div className="flex gap-2 items-center">
                  <span className="badge badge-default text-[10px]">{item.platform}</span>
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
              </div>
              {item.score > 0 && (
                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  ★ {item.score}
                </div>
              )}
              <span className={`badge ${s.class}`}>{s.label}</span>
              <div className="flex gap-1 ml-2">
                <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">✎</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}