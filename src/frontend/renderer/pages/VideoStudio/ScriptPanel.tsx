/**
 * ScriptPanel - 短视频左侧面板（重构版）
 * 
 * 两个模式：
 * 1. planning 阶段：输入主题、选平台、选风格
 * 2. scripting+ 阶段：显示项目概要 + 素材清单总览
 */
import React, { useState } from 'react';
import {
  VideoPlatform, VideoStyle, VideoRatio, ProjectPhase,
  VIDEO_PLATFORMS, VIDEO_STYLES, BGM_STYLES, PHASE_INFO,
  VideoProject,
} from './types';

interface ScriptPanelProps {
  project: VideoProject | null;
  onGenerate: (topic: string, platforms: VideoPlatform[], style: VideoStyle, ratio: VideoRatio, bgm: string) => void;
  onPhaseChange: (phase: ProjectPhase) => void;
  isGenerating: boolean;
}

export function ScriptPanel({ project, onGenerate, onPhaseChange, isGenerating }: ScriptPanelProps) {
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<VideoPlatform[]>(['douyin']);
  const [style, setStyle] = useState<VideoStyle>('slideshow');
  const [ratio, setRatio] = useState<VideoRatio>('9:16');
  const [bgm, setBgm] = useState('轻快活泼');
  const [extra, setExtra] = useState('');

  const togglePlatform = (p: VideoPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    const req = extra.trim() ? `${topic}\n要求：${extra}` : topic;
    onGenerate(req, selectedPlatforms, style, ratio, bgm);
  };

  // ===== 已有项目：显示项目概要 =====
  if (project) {
    const phases: ProjectPhase[] = ['planning', 'scripting', 'collecting', 'editing', 'delivering'];
    const currentIdx = phases.indexOf(project.phase);

    return (
      <div className="w-[300px] border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-[15px] font-bold text-gray-800">短视频工作台</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">FFmpeg 驱动 · 自动剪辑</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {/* 阶段进度 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-[11px] font-bold text-gray-500 mb-3">项目进度</div>
            <div className="space-y-2">
              {phases.map((phase, idx) => {
                const info = PHASE_INFO[phase];
                const isCurrent = phase === project.phase;
                const isDone = idx < currentIdx;
                const isFuture = idx > currentIdx;
                return (
                  <button
                    key={phase}
                    onClick={() => !isFuture && onPhaseChange(phase)}
                    disabled={isFuture}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      isCurrent ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30' :
                      isDone ? 'bg-white border border-gray-100 hover:border-gray-200' :
                      'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                      isCurrent ? 'bg-[#FF6B35] text-white' :
                      isDone ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? '✓' : info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-medium ${isCurrent ? 'text-[#FF6B35]' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                        {info.label}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{info.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 项目概要 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-[11px] font-bold text-gray-500 mb-2">项目概要</div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">标题</span>
                <span className="text-gray-700 font-medium truncate ml-2 max-w-[140px]">{project.title}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">分镜</span>
                <span className="text-gray-700 font-medium">{project.scenes.length} 个</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">时长</span>
                <span className="text-gray-700 font-medium">{project.totalDuration}秒</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">平台</span>
                <span className="text-gray-700 font-medium">
                  {VIDEO_PLATFORMS.filter(p => project.platforms.includes(p.platform)).map(p => p.name).join('、')}
                </span>
              </div>
            </div>
          </div>

          {/* 素材就绪度 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-gray-500">素材就绪度</div>
              <div className={`text-[12px] font-bold ${
                project.readiness.percentage === 100 ? 'text-green-600' :
                project.readiness.percentage >= 60 ? 'text-[#FF6B35]' :
                'text-gray-400'
              }`}>
                {project.readiness.percentage}%
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${project.readiness.percentage}%`,
                  background: project.readiness.percentage === 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #FF6B35, #FF8F5E)',
                }}
              />
            </div>
            <div className="text-[10px] text-gray-400">
              {project.readiness.filledSlots}/{project.readiness.totalSlots} 个素材已就位
            </div>

            {/* 就绪时显示开始剪辑按钮 */}
            {project.readiness.percentage === 100 && project.phase === 'collecting' && (
              <button
                onClick={() => onPhaseChange('editing')}
                className="w-full mt-3 py-2.5 bg-[#FF6B35] text-white text-[12px] font-bold rounded-lg hover:bg-[#ff8050] transition-colors shadow-md shadow-[#FF6B35]/20"
              >
                🎬 素材齐了，开始剪辑
              </button>
            )}

            {project.readiness.percentage < 100 && project.readiness.percentage > 0 && (
              <button
                onClick={() => onPhaseChange('editing')}
                className="w-full mt-3 py-2 bg-white text-gray-500 text-[11px] font-medium rounded-lg border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                素材不全也能剪（AI补位）
              </button>
            )}
          </div>

          {/* 渲染状态 */}
          {project.render.status !== 'idle' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-[11px] font-bold text-gray-500 mb-2">渲染状态</div>
              {project.render.status === 'rendering' || project.render.status === 'encoding' ? (
                <>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 animate-pulse"
                      style={{ width: `${project.render.progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {project.render.status === 'rendering' ? '渲染中' : '编码中'}... {project.render.progress}%
                  </div>
                </>
              ) : project.render.status === 'done' ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-sm">✓</span>
                  <span className="text-[11px] text-green-600 font-medium">渲染完成</span>
                </div>
              ) : project.render.status === 'failed' ? (
                <div className="text-[11px] text-red-500">{project.render.error || '渲染失败'}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 无项目：立项表单 =====
  return (
    <div className="w-[300px] border-r border-gray-100 bg-white flex flex-col shrink-0">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-bold text-gray-800">短视频创作</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">AI 脚本 · 素材收集 · 自动剪辑</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
        {/* 主题 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">视频主题</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={"输入视频主题，比如：\n· 产品使用教程\n· 行业知识科普\n· 品牌故事讲述"}
            className="w-full h-[90px] px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 placeholder:text-gray-300 bg-gray-50/50"
          />
        </div>

        {/* 目标平台 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">目标平台</label>
          <div className="flex flex-wrap gap-2">
            {VIDEO_PLATFORMS.map(p => {
              const active = selectedPlatforms.includes(p.platform);
              return (
                <button
                  key={p.platform}
                  onClick={() => togglePlatform(p.platform)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    active
                      ? 'bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${
                    active ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>{p.icon}</span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 视频风格 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">视频风格</label>
          <div className="grid grid-cols-2 gap-2">
            {VIDEO_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-3 py-2 rounded-lg text-left transition-all border ${
                  style === s.id
                    ? 'bg-[#FF6B35]/10 border-[#FF6B35]/40'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm mb-0.5">{s.icon}</div>
                <div className={`text-[11px] font-medium ${style === s.id ? 'text-[#FF6B35]' : 'text-gray-700'}`}>{s.label}</div>
                <div className="text-[9px] text-gray-400">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 画面比例 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">画面比例</label>
          <div className="flex gap-2">
            {(['9:16', '16:9', '1:1'] as VideoRatio[]).map(r => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                  ratio === r
                    ? 'bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {r === '9:16' ? '竖屏' : r === '16:9' ? '横屏' : '方形'} {r}
              </button>
            ))}
          </div>
        </div>

        {/* BGM */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-2 block">背景音乐风格</label>
          <div className="flex flex-wrap gap-1.5">
            {BGM_STYLES.map(b => (
              <button
                key={b}
                onClick={() => setBgm(b)}
                className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                  bgm === b
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >{b}</button>
            ))}
          </div>
        </div>

        {/* 补充要求 */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">补充要求 <span className="text-gray-300">（可选）</span></label>
          <textarea
            value={extra}
            onChange={e => setExtra(e.target.value)}
            placeholder="比如：突出产品性价比、语气轻松幽默..."
            className="w-full h-[60px] px-3 py-2 text-[12px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#FF6B35] placeholder:text-gray-300 bg-gray-50/50"
          />
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || selectedPlatforms.length === 0 || isGenerating}
          className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all ${
            !topic.trim() || selectedPlatforms.length === 0 || isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF6B35] text-white hover:bg-[#ff8050] shadow-lg shadow-[#FF6B35]/20'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI 正在生成脚本...
            </span>
          ) : (
            '✨ 生成脚本 + 素材清单'
          )}
        </button>

        {/* 提示 */}
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-[11px] text-[#FF6B35] font-medium mb-1">💡 工作流程</div>
          <div className="text-[10px] text-gray-500 space-y-0.5">
            <div>1. AI 生成脚本和分镜，列出需要的素材</div>
            <div>2. 你上传素材，或让 AI 帮你生成</div>
            <div>3. 素材齐了，火花自动用 FFmpeg 剪辑</div>
            <div>4. 预览满意后导出，不满意继续调</div>
          </div>
        </div>
      </div>
    </div>
  );
}
