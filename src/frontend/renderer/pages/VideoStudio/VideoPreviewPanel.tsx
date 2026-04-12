/**
 * VideoPreviewPanel - 视频预览 + 渲染控制（重构版）
 * 
 * 右侧面板：
 * - 分镜预览播放器（模拟手机屏）
 * - 渲染进度
 * - 成品视频播放
 * - 导出按钮
 */
import React, { useState, useEffect, useRef } from 'react';
import { VideoProject, VideoPlatform, VIDEO_PLATFORMS, RenderStatus } from './types';

interface VideoPreviewPanelProps {
  project: VideoProject | null;
  onExport: (platform: VideoPlatform) => void;
  onExportAll: () => void;
  onStartRender: () => void;
  onAdjust: (instruction: string) => void;
}

export function VideoPreviewPanel({ project, onExport, onExportAll, onStartRender, onAdjust }: VideoPreviewPanelProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 自动播放分镜
  useEffect(() => {
    if (!isPlaying || !project) return;
    const scene = project.scenes[currentScene];
    if (!scene) { setIsPlaying(false); return; }

    timerRef.current = setTimeout(() => {
      if (currentScene < project.scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentScene(0);
      }
    }, scene.duration * 1000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentScene, project]);

  if (!project) {
    return (
      <div className="w-[280px] border-l border-gray-100 bg-white flex items-center justify-center shrink-0">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-xl">📺</span>
          </div>
          <p className="text-[12px] text-gray-400">生成脚本后</p>
          <p className="text-[12px] text-gray-400">这里会显示视频预览</p>
        </div>
      </div>
    );
  }

  const scene = project.scenes[currentScene];
  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);
  const elapsed = project.scenes.slice(0, currentScene).reduce((sum, s) => sum + s.duration, 0);
  const selectedPlatforms = VIDEO_PLATFORMS.filter(p => project.platforms.includes(p.platform));
  const isRendering = project.render.status === 'rendering' || project.render.status === 'encoding';
  const isDone = project.render.status === 'done';

  return (
    <div className="w-[280px] border-l border-gray-100 bg-white flex flex-col shrink-0">
      {/* 标题 */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-gray-700">
          {isDone ? '🎉 成品预览' : isRendering ? '🎬 渲染中' : '📺 分镜预览'}
        </span>
        {isDone && (
          <button
            onClick={onExportAll}
            className="text-[11px] text-[#FF6B35] hover:text-[#E55A2B] font-medium transition-colors"
          >
            全部导出 →
          </button>
        )}
      </div>

      {/* 手机预览框 */}
      <div className="px-4 pb-3">
        <div className="relative mx-auto bg-gray-900 rounded-[20px] p-2 shadow-lg" style={{ width: 180 }}>
          {/* 刘海 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-xl z-10" />

          {/* 屏幕 */}
          <div className="relative bg-gray-800 rounded-[14px] overflow-hidden" style={{ aspectRatio: project.ratio === '9:16' ? '9/16' : project.ratio === '16:9' ? '16/9' : '1/1' }}>
            {/* 渲染中 */}
            {isRendering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20">
                <div className="w-10 h-10 border-3 border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mb-3" />
                <div className="text-white text-[11px] font-medium">{project.render.progress}%</div>
                <div className="text-gray-400 text-[9px] mt-1">
                  {project.render.status === 'rendering' ? 'FFmpeg 渲染中...' : '编码输出中...'}
                </div>
              </div>
            )}

            {/* 成品视频 */}
            {isDone && project.render.outputPath && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-900/20 to-green-900/40">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-white text-[11px] font-medium">渲染完成</div>
                <div className="text-gray-300 text-[9px] mt-1">
                  {project.render.outputSize ? `${(project.render.outputSize / 1024 / 1024).toFixed(1)}MB` : ''}
                </div>
              </div>
            )}

            {/* 分镜预览 */}
            {!isRendering && !isDone && scene && (
              <>
                {scene.imageUrl ? (
                  <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3" style={{ backgroundColor: '#1a1a2e' }}>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-400 leading-relaxed">{scene.visualDesc}</div>
                    </div>
                  </div>
                )}

                {/* 字幕 */}
                <div className="absolute bottom-3 left-2 right-2">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5">
                    <p className="text-white text-[9px] leading-relaxed text-center">{scene.narration}</p>
                  </div>
                </div>

                {/* 分镜序号 */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">
                  {currentScene + 1}/{project.scenes.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 播放控制 */}
      {!isRendering && !isDone && (
        <div className="px-4 pb-3">
          {/* 进度条 */}
          <div className="h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
            <div
              className="h-full bg-[#FF6B35] rounded-full transition-all"
              style={{ width: `${totalDuration > 0 ? ((elapsed + (scene?.duration || 0) * 0.5) / totalDuration) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
                disabled={currentScene === 0}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-white hover:bg-[#ff8050] transition-colors shadow-md"
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <button
                onClick={() => setCurrentScene(Math.min(project.scenes.length - 1, currentScene + 1))}
                disabled={currentScene === project.scenes.length - 1}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </button>
            </div>

            <span className="text-[10px] text-gray-400">
              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* 分割线 */}
      <div className="border-t border-gray-100" />

      {/* 下半部分 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* 微调输入（交付阶段） */}
        {isDone && (
          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">💬 不满意？告诉火花怎么改</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={adjustText}
                onChange={e => setAdjustText(e.target.value)}
                placeholder="第二段太长了 / 换个BGM..."
                className="flex-1 px-2.5 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B35] bg-gray-50"
                onKeyDown={e => {
                  if (e.key === 'Enter' && adjustText.trim()) {
                    onAdjust(adjustText.trim());
                    setAdjustText('');
                  }
                }}
              />
              <button
                onClick={() => { if (adjustText.trim()) { onAdjust(adjustText.trim()); setAdjustText(''); } }}
                className="px-3 py-1.5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-lg hover:bg-[#ff8050] transition-colors"
              >调整</button>
            </div>
          </div>
        )}

        {/* 平台适配 */}
        <div>
          <div className="text-[10px] font-bold text-gray-500 mb-2">目标平台</div>
          <div className="space-y-1.5">
            {selectedPlatforms.map(p => (
              <div key={p.platform} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">{p.icon}</span>
                  <span className="text-[11px] text-gray-700 font-medium">{p.name}</span>
                </div>
                {isDone ? (
                  <button
                    onClick={() => onExport(p.platform)}
                    className="text-[10px] text-[#FF6B35] font-medium hover:underline"
                  >导出</button>
                ) : (
                  <span className="text-[9px] text-gray-400">
                    {p.resolution.width}×{p.resolution.height}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 技术信息 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] font-bold text-gray-500 mb-2">技术参数</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">画面比例</span>
              <span className="text-gray-600">{project.ratio}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">总时长</span>
              <span className="text-gray-600">{totalDuration}秒</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">渲染引擎</span>
              <span className="text-gray-600">FFmpeg + moviepy</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">输出格式</span>
              <span className="text-gray-600">MP4 (H.264)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
