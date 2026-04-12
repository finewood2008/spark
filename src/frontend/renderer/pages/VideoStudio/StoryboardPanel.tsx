/**
 * StoryboardPanel - 分镜编辑 + 素材槽位（重构版）
 * 
 * 每个分镜卡片：画面描述 + 口播文案 + 素材槽位（可上传/AI生成）
 * 素材槽位有状态指示：缺失/就绪/生成中
 */
import React, { useState } from 'react';
import {
  VideoProject, SceneBlock, MaterialSlot, MaterialStatus,
  TRANSITION_OPTIONS, TransitionType, ProjectPhase,
} from './types';

interface StoryboardPanelProps {
  project: VideoProject | null;
  onUpdateScene: (sceneId: string, updates: Partial<SceneBlock>) => void;
  onRegenerateImage: (sceneId: string) => void;
  onAddScene: (afterId?: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onUpdateHook: (hook: string) => void;
  onUpdateTitle: (title: string) => void;
  onUploadMaterial: (slotId: string, sceneId: string) => void;
  onGenerateMaterial: (slotId: string, sceneId: string) => void;
}

const STATUS_BADGE: Record<MaterialStatus, { color: string; label: string; icon: string }> = {
  required: { color: 'bg-red-100 text-red-600 border-red-200', label: '缺素材', icon: '⚠️' },
  uploading: { color: 'bg-blue-100 text-blue-600 border-blue-200', label: '上传中', icon: '⬆️' },
  ready: { color: 'bg-green-100 text-green-600 border-green-200', label: '已就位', icon: '✓' },
  generating: { color: 'bg-orange-100 text-orange-600 border-orange-200', label: '生成中', icon: '⏳' },
  failed: { color: 'bg-red-100 text-red-600 border-red-200', label: '失败', icon: '✗' },
  optional: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: '可选', icon: '○' },
};

export function StoryboardPanel({
  project, onUpdateScene, onRegenerateImage,
  onAddScene, onDeleteScene, onUpdateHook, onUpdateTitle,
  onUploadMaterial, onGenerateMaterial,
}: StoryboardPanelProps) {
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polygon points="10 8 16 12 10 16" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-gray-500">在左侧输入主题开始创作</p>
          <p className="text-[11px] text-gray-400 mt-1">AI 会生成分镜脚本 + 素材清单</p>
        </div>
      </div>
    );
  }

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-[720px] mx-auto py-8 px-6">
        {/* 标题 + 总时长 */}
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={project.title}
            onChange={e => onUpdateTitle(e.target.value)}
            className="text-[20px] font-bold text-gray-800 bg-transparent border-none outline-none flex-1 placeholder:text-gray-300"
            placeholder="视频标题..."
          />
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              {project.scenes.length} 个分镜
            </span>
            <span className="text-[11px] text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-1 rounded-md font-medium">
              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Hook */}
        <div className="mb-6">
          <div className="text-[10px] text-gray-400 mb-1">🎣 前3秒钩子</div>
          <input
            type="text"
            value={project.hook}
            onChange={e => onUpdateHook(e.target.value)}
            className="w-full px-3 py-2 text-[13px] bg-orange-50 border border-orange-200 rounded-lg focus:outline-none focus:border-[#FF6B35] text-gray-700"
            placeholder="吸引观众的第一句话..."
          />
        </div>

        {/* 分镜列表 */}
        <div className="space-y-4">
          {project.scenes.map((scene, idx) => {
            const isExpanded = expandedScene === scene.id;
            const slotsFilled = scene.slots.filter(s => s.materialId).length;
            const slotsTotal = scene.slots.filter(s => s.required).length;
            const allReady = slotsTotal > 0 && slotsFilled >= slotsTotal;

            return (
              <div
                key={scene.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-[#FF6B35]/30 shadow-md' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* 分镜头部 */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                >
                  {/* 序号 */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                    allReady ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* 画面预览 */}
                  <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {scene.imageUrl ? (
                      <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : scene.generating ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#FF6B35] rounded-full animate-spin" />
                    ) : (
                      <span className="text-[10px] text-gray-400">待生成</span>
                    )}
                  </div>

                  {/* 文案 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-gray-700 line-clamp-2 leading-relaxed">{scene.narration}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400">{scene.duration}秒</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className={`text-[10px] font-medium ${allReady ? 'text-green-500' : 'text-orange-500'}`}>
                        素材 {slotsFilled}/{slotsTotal}
                      </span>
                    </div>
                  </div>

                  {/* 展开箭头 */}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    {/* 口播文案编辑 */}
                    <div className="mt-3 mb-3">
                      <label className="text-[10px] text-gray-400 mb-1 block">口播文案</label>
                      <textarea
                        value={scene.narration}
                        onChange={e => onUpdateScene(scene.id, { narration: e.target.value })}
                        className="w-full h-[60px] px-3 py-2 text-[12px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#FF6B35] bg-gray-50/50"
                      />
                    </div>

                    {/* 画面描述 */}
                    <div className="mb-3">
                      <label className="text-[10px] text-gray-400 mb-1 block">画面描述 / 拍摄指导</label>
                      <textarea
                        value={scene.visualDesc}
                        onChange={e => onUpdateScene(scene.id, { visualDesc: e.target.value })}
                        className="w-full h-[40px] px-3 py-2 text-[12px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#FF6B35] bg-gray-50/50"
                      />
                    </div>

                    {/* 素材槽位 */}
                    <div className="mb-3">
                      <label className="text-[10px] text-gray-400 mb-2 block">📁 素材槽位</label>
                      <div className="space-y-2">
                        {scene.slots.map(slot => {
                          const badge = STATUS_BADGE[slot.materialId ? 'ready' : slot.required ? 'required' : 'optional'];
                          return (
                            <div key={slot.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badge.color}`}>
                              <span className="text-[11px]">{badge.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium">{slot.label}</div>
                                <div className="text-[9px] opacity-60">{slot.type}</div>
                              </div>
                              {!slot.materialId && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => onUploadMaterial(slot.id, scene.id)}
                                    className="px-2 py-1 bg-white text-[10px] font-medium text-gray-600 rounded border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                                  >上传</button>
                                  <button
                                    onClick={() => onGenerateMaterial(slot.id, scene.id)}
                                    className="px-2 py-1 bg-[#FF6B35] text-[10px] font-medium text-white rounded hover:bg-[#ff8050] transition-colors"
                                  >AI生成</button>
                                </div>
                              )}
                              {slot.materialId && (
                                <span className="text-[10px] text-green-600 font-medium">已绑定</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 转场 + 时长 */}
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 mb-1 block">转场效果</label>
                        <select
                          value={scene.transition}
                          onChange={e => onUpdateScene(scene.id, { transition: e.target.value as TransitionType })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#FF6B35]"
                        >
                          {TRANSITION_OPTIONS.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-gray-400 mb-1 block">时长(秒)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={scene.duration}
                          onChange={e => onUpdateScene(scene.id, { duration: Number(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#FF6B35]"
                        />
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => onRegenerateImage(scene.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >🔄 重新生成画面</button>
                      <button
                        onClick={() => onAddScene(scene.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >➕ 后面插入分镜</button>
                      {project.scenes.length > 1 && (
                        <button
                          onClick={() => onDeleteScene(scene.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                        >🗑 删除</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 添加分镜 */}
        <button
          onClick={() => onAddScene()}
          className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-[12px] text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
        >
          + 添加分镜
        </button>
      </div>
    </div>
  );
}
