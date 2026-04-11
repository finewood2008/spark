/**
 * TabMemoryLayers.tsx - 记忆沉淀
 * 
 * 四层记忆体系：
 * - 事实层：企业基本信息、产品参数（几乎不变）
 * - 偏好层：品牌调性、设计风格偏好（缓慢演化）
 * - 经验层：高表现内容、修改历史（持续积累）
 * - 临时层：当前项目上下文（用完可清理）
 */
import React, { useState } from 'react';

interface Props { brandId: string; }

type LayerType = 'fact' | 'preference' | 'experience' | 'temp';

interface MemoryItem {
  id: string;
  layer: LayerType;
  key: string;
  value: string;
  source: string;
  confidence: number;
  updatedAt: string;
  autoLearned: boolean;
}

const LAYER_META: Record<LayerType, { icon: string; label: string; desc: string; color: string; bg: string; border: string }> = {
  fact:       { icon: 'F', label: '事实层', desc: '企业基本信息、产品参数、价格表', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  preference: { icon: 'P', label: '偏好层', desc: '品牌调性、设计风格、老板审美倾向', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  experience: { icon: 'E', label: '经验层', desc: '高表现内容、修改模式、反馈闭环', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  temp:       { icon: 'T', label: '临时层', desc: '当前项目上下文、本次对话重点', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const MOCK_MEMORIES: MemoryItem[] = [
  { id: '1', layer: 'fact', key: '品牌名称', value: '火花 Spark', source: '品牌字典', confidence: 1.0, updatedAt: '2024-12-01', autoLearned: false },
  { id: '2', layer: 'fact', key: '主营业务', value: 'AI 驱动的品牌设计与内容营销 SaaS', source: '品牌字典', confidence: 1.0, updatedAt: '2024-12-01', autoLearned: false },
  { id: '3', layer: 'fact', key: '目标客群', value: '中小企业主、初创团队、个体创业者', source: '品牌字典', confidence: 0.95, updatedAt: '2024-12-01', autoLearned: false },
  { id: '4', layer: 'fact', key: '核心产品价格', value: '基础版 ¥99/月，专业版 ¥299/月', source: '价格表.xlsx', confidence: 1.0, updatedAt: '2024-11-20', autoLearned: false },
  { id: '5', layer: 'preference', key: '设计风格', value: '温暖、简洁、有人情味的科技感，拒绝冰冷', source: 'AI 学习', confidence: 0.88, updatedAt: '2024-12-05', autoLearned: true },
  { id: '6', layer: 'preference', key: '配色偏好', value: '暖橙色系为主，搭配浅灰白底，避免深色大面积使用', source: 'AI 学习', confidence: 0.82, updatedAt: '2024-12-04', autoLearned: true },
  { id: '7', layer: 'preference', key: 'Logo 风格', value: '偏好简洁优雅，不喜欢太花哨的设计', source: '用户反馈', confidence: 0.92, updatedAt: '2024-12-03', autoLearned: true },
  { id: '8', layer: 'preference', key: '文案语调', value: '专业但不装，温和有主见，像朋友聊天', source: 'AI 学习', confidence: 0.78, updatedAt: '2024-12-02', autoLearned: true },
  { id: '9', layer: 'experience', key: '小红书标题公式', value: '痛点+解决方案+数字 → 点击率 +47%', source: '数据回流', confidence: 0.91, updatedAt: '2024-11-30', autoLearned: true },
  { id: '10', layer: 'experience', key: '海报排版', value: '左图右文比纯文字海报互动率高 2.3 倍', source: '数据回流', confidence: 0.85, updatedAt: '2024-11-28', autoLearned: true },
  { id: '11', layer: 'experience', key: '被否决的方向', value: '深色科技风、赛博朋克风格被明确否决', source: '用户反馈', confidence: 0.95, updatedAt: '2024-12-03', autoLearned: true },
  { id: '12', layer: 'experience', key: '公众号最佳发布时间', value: '周二/周四 20:00-21:00 打开率最高', source: '数据回流', confidence: 0.73, updatedAt: '2024-11-25', autoLearned: true },
  { id: '13', layer: 'temp', key: '当前项目', value: '记忆库页面升级改版', source: '对话上下文', confidence: 1.0, updatedAt: '今天', autoLearned: true },
  { id: '14', layer: 'temp', key: '待处理', value: '竞品分析报告需要更新', source: '告警系统', confidence: 1.0, updatedAt: '今天', autoLearned: true },
];

const LEARNING_LOG = [
  { time: '今天 14:32', event: '用户修改了海报配色 → 偏好层更新：避免大面积使用饱和度过高的红色', type: 'preference' as LayerType },
  { time: '今天 11:15', event: '小红书笔记发布后 2h 数据回流 → 经验层新增：emoji 开头的标题 CTR +23%', type: 'experience' as LayerType },
  { time: '昨天 16:40', event: '用户上传新产品价格表 → 事实层更新：专业版价格调整为 ¥299/月', type: 'fact' as LayerType },
  { time: '昨天 09:20', event: '用户否决了第一版 Logo 方案 → 偏好层新增：不喜欢太花哨的设计', type: 'preference' as LayerType },
  { time: '12月03日', event: '公众号文章阅读数据回流 → 经验层更新：周二/周四晚间发布效果最佳', type: 'experience' as LayerType },
];

export function TabMemoryLayers({ brandId }: Props) {
  const [activeLayer, setActiveLayer] = useState<LayerType | 'all'>('all');
  const [showLog, setShowLog] = useState(false);

  const filtered = activeLayer === 'all' ? MOCK_MEMORIES : MOCK_MEMORIES.filter(m => m.layer === activeLayer);
  const layerCounts = {
    fact: MOCK_MEMORIES.filter(m => m.layer === 'fact').length,
    preference: MOCK_MEMORIES.filter(m => m.layer === 'preference').length,
    experience: MOCK_MEMORIES.filter(m => m.layer === 'experience').length,
    temp: MOCK_MEMORIES.filter(m => m.layer === 'temp').length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* 四层记忆概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {(Object.entries(LAYER_META) as [LayerType, typeof LAYER_META['fact']][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(activeLayer === key ? 'all' : key)}
            className={`text-left p-4 rounded-2xl border transition-all ${
              activeLayer === key
                ? `${meta.bg} ${meta.border} shadow-sm`
                : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{meta.icon}</span>
              <span className={`text-lg font-bold ${activeLayer === key ? meta.color : 'text-gray-800'}`}>{layerCounts[key]}</span>
            </div>
            <div className={`text-sm font-bold ${activeLayer === key ? meta.color : 'text-gray-800'} mb-0.5`}>{meta.label}</div>
            <div className="text-[11px] text-gray-400 leading-relaxed">{meta.desc}</div>
          </button>
        ))}
      </div>

      {/* 自动学习日志 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowLog(!showLog)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            <span className="text-sm font-bold text-gray-800">自动学习日志</span>
            <span className="text-[10px] text-gray-400">Alex 从你的行为中学到了什么</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform ${showLog ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showLog && (
          <div className="px-5 pb-4 space-y-2.5 border-t border-gray-50 pt-3">
            {LEARNING_LOG.map((log, i) => {
              const meta = LAYER_META[log.type];
              return (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="shrink-0 mt-0.5">
                    <span className={`inline-block w-6 h-6 rounded-lg ${meta.bg} ${meta.border} border text-center text-xs leading-6`}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{log.event}</p>
                    <span className="text-[10px] text-gray-400">{log.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 记忆条目列表 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            <span className="text-sm font-bold text-gray-800">
              {activeLayer === 'all' ? '全部记忆' : LAYER_META[activeLayer].label}
            </span>
            <span className="text-[10px] text-gray-400">{filtered.length} 条</span>
          </div>
          <button className="text-xs text-blue-500 hover:text-blue-600 font-medium">+ 手动添加</button>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(item => {
            const meta = LAYER_META[item.layer];
            return (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                {/* 层级标签 */}
                <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold border ${meta.bg} ${meta.border} ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>

                {/* Key */}
                <span className="shrink-0 w-[140px] text-sm font-medium text-gray-800 truncate">{item.key}</span>

                {/* Value */}
                <span className="flex-1 text-sm text-gray-600 truncate">{item.value}</span>

                {/* 置信度 */}
                <div className="shrink-0 w-[80px] flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.confidence >= 0.9 ? 'bg-green-500' : item.confidence >= 0.7 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-[28px] text-right">{Math.round(item.confidence * 100)}%</span>
                </div>

                {/* 来源 & 自动标记 */}
                <div className="shrink-0 w-[90px] text-right">
                  {item.autoLearned && (
                    <span className="inline-block px-1.5 py-0.5 bg-green-50 border border-green-100 text-green-600 text-[9px] font-bold rounded mb-0.5">自动</span>
                  )}
                  <div className="text-[10px] text-gray-400">{item.source}</div>
                </div>

                {/* 操作 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                  <button className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-[10px] font-medium" title="编辑">编辑</button>
                  <button className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 text-[10px] font-medium" title="删除">删除</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
