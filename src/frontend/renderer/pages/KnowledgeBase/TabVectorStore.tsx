/**
 * TabVectorStore.tsx - 向量底座
 * 
 * 企业数据向量化管理中心：
 * - 向量数据库连接状态
 * - 文档列表 + embedding 状态
 * - 上传 & 处理进度
 * - 语义搜索测试
 */
import React, { useState } from 'react';

interface Props { brandId: string; }

type DocStatus = 'embedded' | 'processing' | 'failed' | 'pending';

interface VectorDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  chunks: number;
  vectors: number;
  status: DocStatus;
  progress?: number;
  uploadedAt: string;
  source: string;
}

const STATUS_MAP: Record<DocStatus, { label: string; color: string; bg: string }> = {
  embedded:   { label: '已向量化', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  processing: { label: '处理中',   color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100' },
  failed:     { label: '失败',     color: 'text-red-500',   bg: 'bg-red-50 border-red-100' },
  pending:    { label: '排队中',   color: 'text-gray-500',  bg: 'bg-gray-50 border-gray-200' },
};

const MOCK_DOCS: VectorDoc[] = [
  { id: '1', name: '火花品牌故事.pdf', type: 'PDF', size: '2.3 MB', chunks: 45, vectors: 45, status: 'embedded', uploadedAt: '2024-12-01', source: '手动上传' },
  { id: '2', name: '核心功能介绍.docx', type: 'Word', size: '1.1 MB', chunks: 28, vectors: 28, status: 'embedded', uploadedAt: '2024-12-01', source: '手动上传' },
  { id: '3', name: '小红书爆款笔记合集.md', type: 'Markdown', size: '156 KB', chunks: 67, vectors: 67, status: 'embedded', uploadedAt: '2024-11-28', source: '自动采集' },
  { id: '4', name: '竞品分析报告 Q3.pdf', type: 'PDF', size: '4.7 MB', chunks: 92, vectors: 92, status: 'embedded', uploadedAt: '2024-06-15', source: '手动上传' },
  { id: '5', name: '2024产品价格表.xlsx', type: 'Excel', size: '340 KB', chunks: 15, vectors: 15, status: 'embedded', uploadedAt: '2024-11-20', source: '手动上传' },
  { id: '6', name: '客户访谈记录合集.pdf', type: 'PDF', size: '3.2 MB', chunks: 0, vectors: 0, status: 'processing', progress: 64, uploadedAt: '今天', source: '手动上传' },
  { id: '7', name: '行业白皮书2024.pdf', type: 'PDF', size: '8.1 MB', chunks: 0, vectors: 0, status: 'pending', uploadedAt: '今天', source: '手动上传' },
  { id: '8', name: '旧版宣传册.pdf', type: 'PDF', size: '5.5 MB', chunks: 0, vectors: 0, status: 'failed', uploadedAt: '昨天', source: '手动上传' },
];

const DB_STATUS = {
  connected: true,
  provider: 'Qdrant',
  endpoint: 'localhost:6333',
  collection: 'spark_brand_default',
  dimension: 1536,
  model: 'text-embedding-3-small',
  totalVectors: 2847,
  storageUsed: '48 MB',
};

export function TabVectorStore({ brandId }: Props) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | DocStatus>('all');

  const filtered = MOCK_DOCS.filter(d => filter === 'all' || d.status === filter);

  const handleSemanticSearch = () => {
    if (!search.trim()) return;
    setIsSearching(true);
    // 模拟语义搜索
    setTimeout(() => {
      setSearchResults([
        '【火花品牌故事.pdf · chunk #12】...我们相信每个中小企业都值得拥有专业的品牌视觉形象，这不应该是大企业的专利...',
        '【核心功能介绍.docx · chunk #3】...AI 内容生成引擎能够根据品牌调性自动产出符合平台规范的营销内容...',
        '【小红书爆款笔记合集.md · chunk #45】...标题公式：痛点+解决方案+数字，这种结构在测试中点击率提升了 47%...',
      ]);
      setIsSearching(false);
    }, 800);
  };

  const db = DB_STATUS;

  return (
    <div className="p-8 space-y-6">
      {/* 向量数据库连接状态 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            <span className="text-sm font-bold text-gray-800">向量数据库</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${db.connected ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${db.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {db.connected ? '已连接' : '未连接'}
            </span>
          </div>
          <button className="text-xs text-blue-500 hover:text-blue-600 font-medium">配置连接 →</button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '数据库', value: db.provider, sub: db.endpoint },
            { label: 'Embedding 模型', value: db.model, sub: `${db.dimension} 维` },
            { label: '总向量数', value: db.totalVectors.toLocaleString(), sub: db.storageUsed },
            { label: '集合', value: db.collection, sub: '活跃' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <div className="text-[10px] text-gray-400 font-medium mb-1">{item.label}</div>
              <div className="text-sm font-bold text-gray-800 truncate">{item.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 语义搜索测试 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span className="text-sm font-bold text-gray-800">语义搜索测试</span>
          <span className="text-[10px] text-gray-400">验证向量检索效果</span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            placeholder="输入自然语言查询，如：我们的核心竞争力是什么？"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSemanticSearch()}
          />
          <button
            onClick={handleSemanticSearch}
            disabled={isSearching}
            className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0"
          >
            {isSearching ? '检索中...' : '语义检索'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2 mt-3">
            {searchResults.map((r, i) => (
              <div key={i} className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                <span className="text-blue-500 font-medium">#{i + 1}</span>
                <span className="ml-2">{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 文档列表 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span className="text-sm font-bold text-gray-800">文档管理</span>
            <span className="text-[10px] text-gray-400">{MOCK_DOCS.length} 个文档</span>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'embedded', 'processing', 'pending', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                  filter === f ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? '全部' : STATUS_MAP[f].label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(doc => {
            const st = STATUS_MAP[doc.status];
            return (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                {/* 文件图标 */}
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {doc.type.slice(0, 3).toUpperCase()}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{doc.name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span>{doc.size}</span>
                    <span>·</span>
                    <span>{doc.source}</span>
                    <span>·</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>

                {/* 向量化信息 / 进度 */}
                <div className="w-[160px] shrink-0">
                  {doc.status === 'embedded' && (
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-700">{doc.chunks} chunks · {doc.vectors} vectors</div>
                      <div className="w-full h-1 bg-green-100 rounded-full mt-1">
                        <div className="h-full bg-green-500 rounded-full w-full" />
                      </div>
                    </div>
                  )}
                  {doc.status === 'processing' && (
                    <div>
                      <div className="text-xs text-blue-600 font-medium text-right">{doc.progress}%</div>
                      <div className="w-full h-1.5 bg-blue-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all animate-pulse" style={{ width: `${doc.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {doc.status === 'failed' && (
                    <button className="text-xs text-red-500 hover:text-red-600 font-medium">重新处理 →</button>
                  )}
                  {doc.status === 'pending' && (
                    <span className="text-xs text-gray-400">等待处理...</span>
                  )}
                </div>

                {/* 操作 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-[10px] font-medium" title="查看详情">查看</button>
                  <button className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 text-[10px] font-medium" title="删除">删除</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
