/**
 * VideoStudio - 短视频创作模块（重构版）
 * 
 * 核心理念：火花是"自动导演"
 * 五阶段流程：立项 → 脚本分镜 → 素材收集 → 自动剪辑(FFmpeg) → 微调交付
 * 
 * 三栏布局：左侧控制面板 | 中间分镜/素材编辑 | 右侧视频预览
 */
import React, { useState, useCallback } from 'react';
import { VideoChatPanel } from './VideoChatPanel';
import { StoryboardPanel } from './StoryboardPanel';
import { VideoPreviewPanel } from './VideoPreviewPanel';
import {
  VideoProject, SceneBlock, MaterialSlot, Material,
  VideoPlatform, VideoStyle, VideoRatio, ProjectPhase,
  TransitionType,
} from './types';

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 为分镜生成默认素材槽位 */
function createSlotsForScene(sceneId: string, style: VideoStyle): MaterialSlot[] {
  const slots: MaterialSlot[] = [
    { id: uid(), sceneId, type: 'image', label: '主画面', required: true },
  ];

  if (style === 'talking_head' || style === 'vlog') {
    slots.push({ id: uid(), sceneId, type: 'video_clip', label: '实拍视频', required: true });
    slots[0].required = false; // 有视频就不强制要图
  }

  if (style === 'product_showcase') {
    slots.push({ id: uid(), sceneId, type: 'image', label: '产品图', required: true });
  }

  slots.push({ id: uid(), sceneId, type: 'voiceover', label: '口播录音', required: false, fallback: 'TTS自动生成' });

  return slots;
}

/** 计算素材就绪度 */
function calcReadiness(scenes: SceneBlock[]) {
  let totalSlots = 0;
  let filledSlots = 0;
  scenes.forEach(s => {
    s.slots.forEach(slot => {
      if (slot.required) {
        totalSlots++;
        if (slot.materialId) filledSlots++;
      }
    });
  });
  return {
    totalSlots,
    filledSlots,
    percentage: totalSlots === 0 ? 100 : Math.round((filledSlots / totalSlots) * 100),
  };
}

/** 调用真实 API 生成分镜脚本 */
async function generateScript(
  topic: string, platforms: VideoPlatform[], style: VideoStyle, ratio: VideoRatio, bgm: string
): Promise<VideoProject> {
  // 尝试 IPC
  if (window.spark?.video?.generate) {
    const res = await window.spark.video.generate({
      topic, platforms, style, ratio, bgm,
    });

    if (res.success && res.data) {
      const data = res.data;
      const scenes: SceneBlock[] = (data.scenes || []).map((s: any, i: number) => ({
        id: uid(),
        order: i + 1,
        duration: s.duration || 5,
        narration: s.narration || '',
        visualDesc: s.visualDesc || '',
        transition: (s.transition || 'fade') as TransitionType,
        slots: [],
      }));

      // 为每个分镜生成素材槽位
      scenes.forEach(s => {
        s.slots = createSlotsForScene(s.id, style);
      });

      const readiness = calcReadiness(scenes);

      return {
        id: uid(),
        title: data.title || `${topic.slice(0, 20)} | 短视频`,
        hook: data.hook || scenes[0]?.narration || '',
        scenes,
        bgmStyle: bgm,
        subtitleStyle: 'bottom_center',
        ratio,
        style,
        platforms,
        totalDuration: scenes.reduce((s, sc) => s + sc.duration, 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        phase: 'collecting',
        materials: [],
        readiness,
        render: { status: 'idle', progress: 0 },
      };
    }
    throw new Error(res.error || 'AI 生成分镜失败');
  }

  // Fallback: agent:chat
  if (window.spark?.agent?.chat) {
    const prompt = `请为"${topic}"生成一份${style}风格的短视频分镜脚本，目标平台：${platforms.join('、')}，比例${ratio}，BGM风格${bgm}。要求5-7个分镜，每个包含时长、口播文案、画面描述。`;
    const res = await window.spark.agent.chat(prompt);
    const text = res.message || '';

    const defaultScene: SceneBlock = {
      id: uid(), order: 1, duration: 30,
      narration: text, visualDesc: '根据AI文案自行安排画面',
      transition: 'fade', slots: [],
    };
    defaultScene.slots = createSlotsForScene(defaultScene.id, style);

    return {
      id: uid(),
      title: `${topic.slice(0, 20)} | 短视频`,
      hook: text.slice(0, 30),
      scenes: [defaultScene],
      bgmStyle: bgm, subtitleStyle: 'bottom_center', ratio, style, platforms,
      totalDuration: 30, createdAt: Date.now(), updatedAt: Date.now(),
      phase: 'collecting', materials: [],
      readiness: calcReadiness([defaultScene]),
      render: { status: 'idle', progress: 0 },
    };
  }

  throw new Error('未连接到 AI 服务');
}

export function VideoStudio() {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成脚本
  const handleGenerate = useCallback(async (
    topic: string, platforms: VideoPlatform[], style: VideoStyle, ratio: VideoRatio, bgm: string
  ) => {
    setIsGenerating(true);
    try {
      const result = await generateScript(topic, platforms, style, ratio, bgm);
      setProject(result);

      // 分镜参考画面：标记 generating 后延时完成
      result.scenes.forEach((scene, i) => {
        setTimeout(() => {
          setProject(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              scenes: prev.scenes.map(s =>
                s.id === scene.id ? { ...s, generating: true } : s
              ),
            };
          });
        }, i * 800);

        setTimeout(() => {
          setProject(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              scenes: prev.scenes.map(s =>
                s.id === scene.id ? { ...s, generating: false } : s
              ),
            };
          });
        }, i * 800 + 1500);
      });
    } catch (err: any) {
      console.error('[VideoStudio] 生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 阶段切换
  const handlePhaseChange = useCallback((phase: ProjectPhase) => {
    setProject(prev => {
      if (!prev) return prev;

      // 如果进入剪辑阶段，模拟渲染
      if (phase === 'editing' && prev.phase !== 'editing') {
        simulateRender();
      }

      return { ...prev, phase, updatedAt: Date.now() };
    });
  }, []);

  // 模拟FFmpeg渲染
  const simulateRender = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setProject(prev => prev ? {
          ...prev,
          phase: 'delivering',
          render: {
            status: 'done',
            progress: 100,
            outputPath: '/tmp/spark-video-output.mp4',
            outputSize: 15 * 1024 * 1024,
            finishedAt: Date.now(),
          },
        } : prev);
        return;
      }
      setProject(prev => prev ? {
        ...prev,
        render: {
          ...prev.render,
          status: progress < 80 ? 'rendering' : 'encoding',
          progress: Math.round(progress),
          startedAt: prev.render.startedAt || Date.now(),
        },
      } : prev);
    }, 500);
  };

  // 更新分镜
  const handleUpdateScene = useCallback((sceneId: string, updates: Partial<SceneBlock>) => {
    setProject(prev => {
      if (!prev) return prev;
      const scenes = prev.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s);
      return {
        ...prev,
        scenes,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
        readiness: calcReadiness(scenes),
        updatedAt: Date.now(),
      };
    });
  }, []);

  // 重新生成画面
  const handleRegenerateImage = useCallback((sceneId: string) => {
    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, generating: true } : s),
      };
    });
    setTimeout(() => {
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, generating: false } : s),
        };
      });
    }, 2000);
  }, []);

  // 添加分镜
  const handleAddScene = useCallback((afterId?: string) => {
    setProject(prev => {
      if (!prev) return prev;
      const newScene: SceneBlock = {
        id: uid(),
        order: prev.scenes.length + 1,
        duration: 5,
        narration: '',
        visualDesc: '',
        transition: 'cut',
        slots: createSlotsForScene(uid(), prev.style),
      };
      let scenes: SceneBlock[];
      if (afterId) {
        const idx = prev.scenes.findIndex(s => s.id === afterId);
        scenes = [...prev.scenes.slice(0, idx + 1), newScene, ...prev.scenes.slice(idx + 1)];
      } else {
        scenes = [...prev.scenes, newScene];
      }
      scenes.forEach((s, i) => { s.order = i + 1; });
      return {
        ...prev,
        scenes,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
        readiness: calcReadiness(scenes),
        updatedAt: Date.now(),
      };
    });
  }, []);

  // 删除分镜
  const handleDeleteScene = useCallback((sceneId: string) => {
    setProject(prev => {
      if (!prev || prev.scenes.length <= 1) return prev;
      const scenes = prev.scenes.filter(s => s.id !== sceneId);
      scenes.forEach((s, i) => { s.order = i + 1; });
      return {
        ...prev,
        scenes,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
        readiness: calcReadiness(scenes),
        updatedAt: Date.now(),
      };
    });
  }, []);

  // 上传素材（模拟）
  const handleUploadMaterial = useCallback((slotId: string, sceneId: string) => {
    // 模拟上传成功
    const materialId = uid();
    setProject(prev => {
      if (!prev) return prev;
      const newMaterial: Material = {
        id: materialId,
        type: 'image',
        source: 'user_upload',
        status: 'ready',
        label: '用户上传素材',
        addedAt: Date.now(),
      };
      const scenes = prev.scenes.map(s => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          slots: s.slots.map(slot =>
            slot.id === slotId ? { ...slot, materialId } : slot
          ),
        };
      });
      return {
        ...prev,
        scenes,
        materials: [...prev.materials, newMaterial],
        readiness: calcReadiness(scenes),
        updatedAt: Date.now(),
      };
    });
  }, []);

  // AI生成素材（模拟）
  const handleGenerateMaterial = useCallback((slotId: string, sceneId: string) => {
    const materialId = uid();
    // 先标记生成中
    setProject(prev => {
      if (!prev) return prev;
      const newMaterial: Material = {
        id: materialId,
        type: 'image',
        source: 'ai_generated',
        status: 'generating',
        label: 'AI生成素材',
        addedAt: Date.now(),
      };
      return {
        ...prev,
        materials: [...prev.materials, newMaterial],
      };
    });

    // 2秒后完成
    setTimeout(() => {
      setProject(prev => {
        if (!prev) return prev;
        const scenes = prev.scenes.map(s => {
          if (s.id !== sceneId) return s;
          return {
            ...s,
            slots: s.slots.map(slot =>
              slot.id === slotId ? { ...slot, materialId } : slot
            ),
          };
        });
        return {
          ...prev,
          scenes,
          materials: prev.materials.map(m =>
            m.id === materialId ? { ...m, status: 'ready' as const } : m
          ),
          readiness: calcReadiness(scenes),
          updatedAt: Date.now(),
        };
      });
    }, 2000);
  }, []);

  // 微调指令
  const handleAdjust = useCallback((instruction: string) => {
    console.log('微调指令:', instruction);
    // TODO: 解析指令，调整参数，重新渲染
  }, []);

  // 开始渲染
  const handleStartRender = useCallback(() => {
    handlePhaseChange('editing');
  }, [handlePhaseChange]);

  return (
    <div className="flex h-full">
      <VideoChatPanel
        project={project}
        onGenerate={handleGenerate}
        onPhaseChange={handlePhaseChange}
        isGenerating={isGenerating}
      />
      <StoryboardPanel
        project={project}
        onUpdateScene={handleUpdateScene}
        onRegenerateImage={handleRegenerateImage}
        onAddScene={handleAddScene}
        onDeleteScene={handleDeleteScene}
        onUpdateHook={(hook) => setProject(prev => prev ? { ...prev, hook } : prev)}
        onUpdateTitle={(title) => setProject(prev => prev ? { ...prev, title } : prev)}
        onUploadMaterial={handleUploadMaterial}
        onGenerateMaterial={handleGenerateMaterial}
      />
      <VideoPreviewPanel
        project={project}
        onExport={(platform) => console.log('导出到', platform)}
        onExportAll={() => console.log('全部导出')}
        onStartRender={handleStartRender}
        onAdjust={handleAdjust}
      />
    </div>
  );
}
