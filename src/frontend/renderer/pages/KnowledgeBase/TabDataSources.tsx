/**
 * TabDataSources.tsx - 数据源连接器
 * 
 * 对接外部系统：
 * - 公众号历史文章同步
 * - 电商后台产品数据
 * - 企业网盘文档导入
 * - 小红书/抖音数据回流
 */
import React, { useState } from 'react';

interface Props { brandId: string; }

type SourceStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

interface DataSource {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: SourceStatus;
  lastSync?: string;
  docsImported?: number;
  category: 'content' | 'ecommerce' | 'storage' | 'analytics';
}

const STATUS_MAP: Record<SourceStatus, { label: string; color: string; bg: string; dot: string }> = {
  connected:    { label: '已连接', color: 'text-green-600', bg: 'bg-green-50 border-green-100', dot: 'bg-green-500' },
  disconnected: { label: '未连接', color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
  syncing:      { label: '同步中', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500 animate-pulse' },
  error:        { label: '异常',   color: 'text-red-500', bg: 'bg-red-50 border-red-100', dot: 'bg-red-500' },
};

const SOURCES: DataSource[] = [
  { id: 'wechat', name: '微信公众号', icon: '微', description: '自动同步历史文章、阅读数据、粉丝画像', status: 'connected', lastSync: '2 小时前', docsImported: 47, category: 'content' },
  { id: 'xiaohongshu', name: '小红书', icon: '红', description: '同步笔记内容、互动数据、热门话题', status: 'connected', lastSync: '6 小时前', docsImported: 23, category: 'content' },
  { id: 'douyin', name: '抖音', icon: '抖', description: '同步视频脚本、播放数据、评论分析', status: 'disconnected', category: 'content' },
  { id: 'weibo', name: '微博', icon: '博', description: '同步微博内容、转发数据、话题热度', status: 'disconnected', category: 'content' },
  { id: 'shopify', name: 'Shopify', icon: 'S', description: '同步产品目录、价格、库存、销售数据', status: 'connected', lastSync: '1 天前', docsImported: 156, category: 'ecommerce' },
  { id: 'taobao', name: '淘宝/天猫', icon: '淘', description: '同步商品信息、评价数据、销量趋势', status: 'disconnected', category: 'ecommerce' },
  { id: 'pinduoduo', name: '拼多多', icon: '拼', description: '同步商品数据、营销活动、用户反馈', status: 'disconnected', category: 'ecommerce' },
  { id: 'feishu', name: '飞书文档', icon: '飞', description: '自动导入飞书知识库、文档、表格', status: 'syncing', lastSync: '同步中...', docsImported: 12, category: 'storage' },
  { id: 'notion', name: 'Notion', icon: 'N', description: '同步 Notion 页面、数据库、知识库', status: 'disconnected', category: 'storage' },
  { id: 'gdrive', name: 'Google Drive', icon: 'G', description: '导入 Google 文档、表格、演示文稿', status: 'disconnected', category: 'storage' },
  { id: 'ga', name: 'Google Analytics', icon: 'A', description: '网站流量数据、用户行为、转化漏斗', status: 'error', lastSync: '3 天前', docsImported: 0, category: 'analytics' },
  { id: 'baidu', name: '百度统计', icon: '百', description: '网站访问数据、搜索关键词、来源分析', status: 'disconnected', category: 'analytics' },
];

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'content', label: '内容平台' },
  { id: 'ecommerce', label: '电商平台' },
  { id: 'storage', label: '文档存储' },
  { id: 'analytics', label: '数据分析' },
];

export function TabDataSources({ brandId }: Props) {
  const [category, setCategory] = useState('all');

  const filtered = category === 'all' ? SOURCES : SOURCES.filter(s => s.category === category);
  const connectedCount = SOURCES.filter(s => s.status === 'connected' || s.status === 'syncing').length;
  const totalImported = SOURCES.reduce((sum, s) => sum + (s.docsImported || 0), 0);

  return (
    <div className="p-8 space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-medium mb-1">已连接数据源</div>
          <div className="text-2xl font-bold text-gray-800">{connectedCount}<span className="text-sm text-gray-400 font-normal ml-1">/ {SOURCES.length}</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-medium mb-1">已导入文档</div>
          <div className="text-2xl font-bold text-gray-800">{totalImported}<span className="text-sm text-gray-400 font-normal ml-1">篇</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-medium mb-1">自动同步</div>
          <div className="text-2xl font-bold text-green-600">开启<span className="text-sm text-gray-400 font-normal ml-1">每 6h</span></div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              category === cat.id
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200 hover:text-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 数据源卡片网格 */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(source => {
          const st = STATUS_MAP[source.status];
          const isActive = source.status === 'connected' || source.status === 'syncing';
          return (
            <div
              key={source.id}
              className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer group ${
                isActive
                  ? 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">{source.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{source.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span className={`text-[10px] font-medium ${st.color}`}>{st.label}</span>
                      {source.lastSync && (
                        <span className="text-[10px] text-gray-400">· {source.lastSync}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-4">{source.description}</p>

              <div className="flex items-center justify-between">
                {source.docsImported !== undefined && source.docsImported > 0 ? (
                  <span className="text-[11px] text-gray-400">
                    已导入 <span className="font-bold text-gray-600">{source.docsImported}</span> 篇
                  </span>
                ) : (
                  <span />
                )}

                {source.status === 'connected' && (
                  <div className="flex gap-1.5">
                    <button className="px-3 py-1.5 text-[11px] font-medium text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      立即同步
                    </button>
                    <button className="px-3 py-1.5 text-[11px] font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      设置
                    </button>
                  </div>
                )}
                {source.status === 'disconnected' && (
                  <button className="px-4 py-1.5 text-[11px] font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                    连接
                  </button>
                )}
                {source.status === 'syncing' && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-blue-500 font-medium">同步中...</span>
                  </div>
                )}
                {source.status === 'error' && (
                  <button className="px-3 py-1.5 text-[11px] font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    重新连接
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 自定义数据源 */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 01-12 0V8z"/></svg>
        <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">添加自定义数据源</p>
        <p className="text-[11px] text-gray-400 mt-1">支持 API、Webhook、CSV 导入等方式</p>
      </div>
    </div>
  );
}
