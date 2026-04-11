/**
 * TabKnowledgeGraph.tsx - 知识图谱可视化
 * 
 * 用 CSS + SVG 实现简易的知识关联网络图
 * 展示企业知识之间的关联关系
 */
import React, { useState } from 'react';

interface Props { brandId: string; }

interface GraphNode {
  id: string;
  label: string;
  type: 'brand' | 'product' | 'content' | 'audience' | 'competitor';
  x: number;
  y: number;
  size: number;
  connections: string[];
}

const TYPE_STYLE: Record<string, { color: string; bg: string; border: string; ring: string }> = {
  brand:      { color: '#FF6B35', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-200' },
  product:    { color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-200' },
  content:    { color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200', ring: 'ring-purple-200' },
  audience:   { color: '#10B981', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-200' },
  competitor: { color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-200' },
};

const NODES: GraphNode[] = [
  { id: 'brand', label: '火花 Spark', type: 'brand', x: 50, y: 45, size: 56, connections: ['product1', 'product2', 'audience1', 'content1', 'content2', 'content3'] },
  { id: 'product1', label: 'AI 内容生成', type: 'product', x: 25, y: 25, size: 44, connections: ['brand', 'content1', 'content2'] },
  { id: 'product2', label: '品牌管理工具', type: 'product', x: 75, y: 22, size: 44, connections: ['brand', 'content3'] },
  { id: 'audience1', label: '中小企业主', type: 'audience', x: 20, y: 65, size: 42, connections: ['brand', 'content1'] },
  { id: 'audience2', label: '初创团队', type: 'audience', x: 42, y: 78, size: 36, connections: ['audience1', 'product1'] },
  { id: 'content1', label: '小红书笔记 ×3', type: 'content', x: 15, y: 42, size: 38, connections: ['brand', 'product1', 'audience1'] },
  { id: 'content2', label: '公众号文章 ×5', type: 'content', x: 68, y: 55, size: 38, connections: ['brand', 'product1'] },
  { id: 'content3', label: '海报设计 ×2', type: 'content', x: 82, y: 40, size: 36, connections: ['brand', 'product2'] },
  { id: 'comp1', label: 'Canva', type: 'competitor', x: 80, y: 72, size: 34, connections: ['product2'] },
  { id: 'comp2', label: '稿定设计', type: 'competitor', x: 60, y: 80, size: 34, connections: ['product1', 'comp1'] },
];

const LEGEND = [
  { type: 'brand', label: '品牌核心' },
  { type: 'product', label: '产品/服务' },
  { type: 'content', label: '内容作品' },
  { type: 'audience', label: '目标客群' },
  { type: 'competitor', label: '竞品' },
];

export function TabKnowledgeGraph({ brandId }: Props) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeNode = hoveredNode || selectedNode;

  // 生成连线
  const edges: { from: GraphNode; to: GraphNode }[] = [];
  const edgeSet = new Set<string>();
  NODES.forEach(node => {
    node.connections.forEach(targetId => {
      const key = [node.id, targetId].sort().join('-');
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        const target = NODES.find(n => n.id === targetId);
        if (target) edges.push({ from: node, to: target });
      }
    });
  });

  const isConnected = (nodeId: string) => {
    if (!activeNode) return true;
    if (nodeId === activeNode) return true;
    const node = NODES.find(n => n.id === activeNode);
    return node?.connections.includes(nodeId) || false;
  };

  const isEdgeActive = (from: string, to: string) => {
    if (!activeNode) return true;
    return from === activeNode || to === activeNode;
  };

  const selected = selectedNode ? NODES.find(n => n.id === selectedNode) : null;

  return (
    <div className="p-8 flex gap-6 h-full">
      {/* 图谱区域 */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* 图例 */}
        <div className="absolute top-4 left-4 z-10 flex gap-3">
          {LEGEND.map(l => (
            <div key={l.type} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_STYLE[l.type].color }} />
              <span className="text-[10px] text-gray-500 font-medium">{l.label}</span>
            </div>
          ))}
        </div>

        {/* 提示 */}
        <div className="absolute top-4 right-4 z-10 text-[10px] text-gray-400">
          点击节点查看详情 · 悬停高亮关联
        </div>

        {/* SVG 连线 */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {edges.map((edge, i) => {
            const active = isEdgeActive(edge.from.id, edge.to.id);
            return (
              <line
                key={i}
                x1={`${edge.from.x}%`} y1={`${edge.from.y}%`}
                x2={`${edge.to.x}%`} y2={`${edge.to.y}%`}
                stroke={active ? '#d1d5db' : '#f3f4f6'}
                strokeWidth={active ? 1.5 : 0.5}
                strokeDasharray={active ? 'none' : '4 4'}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* 节点 */}
        {NODES.map(node => {
          const style = TYPE_STYLE[node.type];
          const connected = isConnected(node.id);
          const isActive = node.id === activeNode;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`absolute rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-300 cursor-pointer z-10
                ${isActive ? `ring-4 ${style.ring} scale-110 shadow-lg` : ''}
                ${connected ? 'opacity-100' : 'opacity-20'}
              `}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: node.size,
                height: node.size,
                transform: `translate(-50%, -50%) ${isActive ? 'scale(1.1)' : 'scale(1)'}`,
                backgroundColor: style.color + '15',
                borderColor: style.color + '60',
                color: style.color,
              }}
            >
              <span className="truncate px-1 text-center leading-tight" style={{ fontSize: node.size < 40 ? 9 : 11 }}>
                {node.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 右侧详情面板 */}
      <div className="w-[280px] shrink-0 space-y-4">
        {/* 统计 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">图谱统计</h3>
          <div className="space-y-2.5">
            {[
              { label: '知识节点', value: NODES.length },
              { label: '关联关系', value: edges.length },
              { label: '知识密度', value: `${(edges.length / NODES.length).toFixed(1)}` },
              { label: '孤立节点', value: '0' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-sm font-bold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 选中节点详情 */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: TYPE_STYLE[selected.type].color }} />
              <h3 className="text-sm font-bold text-gray-800">{selected.label}</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>类型</span>
                <span className="font-medium text-gray-700">{LEGEND.find(l => l.type === selected.type)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>关联数</span>
                <span className="font-medium text-gray-700">{selected.connections.length}</span>
              </div>
              <div>
                <span className="block mb-1.5">关联节点：</span>
                <div className="flex flex-wrap gap-1">
                  {selected.connections.map(cId => {
                    const cn = NODES.find(n => n.id === cId);
                    if (!cn) return null;
                    return (
                      <span
                        key={cId}
                        onClick={() => setSelectedNode(cId)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity border"
                        style={{
                          backgroundColor: TYPE_STYLE[cn.type].color + '10',
                          borderColor: TYPE_STYLE[cn.type].color + '30',
                          color: TYPE_STYLE[cn.type].color,
                        }}
                      >
                        {cn.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-300"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            <p className="text-xs text-gray-400 leading-relaxed">点击图谱中的节点<br/>查看知识关联详情</p>
          </div>
        )}

        {/* 建议 */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
          <h3 className="text-xs font-bold text-blue-700 mb-2">建议</h3>
          <div className="space-y-1.5 text-[11px] text-blue-600 leading-relaxed">
            <p>• 竞品节点关联较少，建议补充竞品分析资料</p>
            <p>• "初创团队"客群缺少专属内容，可以针对性创作</p>
            <p>• 品牌核心节点关联最密，知识结构健康</p>
          </div>
        </div>
      </div>
    </div>
  );
}
