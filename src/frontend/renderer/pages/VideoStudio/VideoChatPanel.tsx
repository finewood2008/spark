/**
 * VideoChatPanel — 短视频创作对话面板
 * 
 * 产品形态：AI导演 / 视频制作
 * 调性：红橙色、动感、导演棚氛围
 * 核心差异：围绕"拍"展开 — 脚本、分镜、素材、剪辑、BGM
 */
import React, { useEffect, useCallback } from 'react';
import {
  ChatPanel, useChatFlow,
  sparkText, sparkSelection, sparkConfirm, sparkInput, sparkProgress,
  FlowStep, ChatMessage, chatId,
  QuickAction, StarterCard,
} from '../../components/ChatFlow';
import {
  VideoPlatform, VideoStyle, VideoRatio, ProjectPhase,
  VIDEO_PLATFORMS, VIDEO_STYLES, BGM_STYLES, PHASE_INFO,
  VideoProject,
} from './types';

// ========== 视频专属配置 ==========

const VIDEO_ACCENT = '#E8453C';  // 红橙 — 视频的热烈感，区别于图文的暖橙

/** 初始选项卡 — 视频场景 */
const VIDEO_STARTER: StarterCard = {
  title: '想拍什么视频？',
  desc: '选一个场景快速开始，或者直接描述你的想法',
  options: [
    { id: 'product_demo', label: '产品演示 — 展示产品功能和亮点', icon: '📦' },
    { id: 'tutorial', label: '教程攻略 — 手把手教用户操作', icon: '🎓' },
    { id: 'brand_promo', label: '品牌宣传 — 30秒品牌形象片', icon: '🎬' },
    { id: 'trending', label: '热点蹭流 — 结合热门话题做内容', icon: '🔥' },
    { id: 'behind_scenes', label: '幕后花絮 — 展示团队和工作日常', icon: '🎥' },
  ],
};

/** 悬浮快捷气泡 — 视频常用操作 */
const VIDEO_QUICK_ACTIONS: QuickAction[] = [
  { id: 'add_scene', label: '加一个分镜', icon: '➕' },
  { id: 'change_bgm', label: '换BGM', icon: '🎵' },
  { id: 'add_subtitle', label: '加字幕', icon: '💬' },
  { id: 'speed_up', label: '节奏快一点', icon: '⚡' },
];

/** 场景预设主题 */
const SCENE_TOPICS: Record<string, string> = {
  product_demo: '产品功能演示视频',
  tutorial: '使用教程攻略视频',
  brand_promo: '品牌宣传短片',
  trending: '热点话题短视频',
  behind_scenes: '团队幕后花絮',
};

// ========== 对话流程 ==========

interface VideoChatPanelProps {
  project: VideoProject | null;
  onGenerate: (topic: string, platforms: VideoPlatform[], style: VideoStyle, ratio: VideoRatio, bgm: string) => void;
  onPhaseChange: (phase: ProjectPhase) => void;
  isGenerating: boolean;
}

function createVideoFlowSteps(onGenerate: VideoChatPanelProps['onGenerate']): FlowStep[] {
  return [
    // Step 1: 问主题
    {
      id: 'topic',
      field: 'topic',
      messages: () => [
        sparkInput('想拍什么视频？给我一个主题，比如"产品开箱测评"、"30秒品牌宣传片"。', {
          placeholder: '描述你的视频想法...',
          multiline: true,
        }),
      ],
      validate: (value) => {
        if (typeof value === 'string' && value.trim().length < 2) {
          return '再多说几个字，让我更好理解你想拍什么 🎬';
        }
        return null;
      },
    },

    // Step 2: 选平台 — 视频平台
    {
      id: 'platforms',
      field: 'platforms',
      messages: (collected) => [
        sparkText(`"${(collected.topic as string).slice(0, 15)}"，这个选题有画面感 👍`),
        sparkSelection({
          title: '视频要发到哪些平台？不同平台我会调整时长和节奏',
          multiple: true,
          minSelect: 1,
          columns: 2,
          options: VIDEO_PLATFORMS.map(p => ({
            id: p.platform,
            label: p.name,
            icon: p.icon,
            desc: p.features[0],
          })),
        }),
      ],
    },

    // Step 3: 选风格 — 视频特有
    {
      id: 'style',
      field: 'style',
      messages: () => [
        sparkText('视频用什么风格？这决定了分镜节奏和转场方式'),
        sparkSelection({
          title: '选一个最适合的',
          multiple: false,
          columns: 2,
          options: VIDEO_STYLES.map(s => ({
            id: s.id,
            label: s.label,
            icon: s.icon,
            desc: s.desc,
          })),
        }),
      ],
    },

    // Step 4: 选比例 — 视频特有
    {
      id: 'ratio',
      field: 'ratio',
      messages: (collected) => {
        const platforms = collected.platforms as string[];
        const hasVertical = platforms.some(p => ['douyin', 'kuaishou', 'xiaohongshu', 'tiktok'].includes(p));
        const hasHorizontal = platforms.some(p => ['bilibili'].includes(p));
        let hint = '';
        if (hasVertical && !hasHorizontal) hint = '你选的平台以竖屏为主，推荐 9:16 📱';
        else if (hasHorizontal && !hasVertical) hint = 'B站以横屏为主，推荐 16:9 🖥️';
        else hint = '根据你选的平台，竖屏和横屏都可以';

        return [
          sparkText(hint),
          sparkSelection({
            title: '选择画面比例',
            multiple: false,
            columns: 3,
            options: [
              { id: '9:16', label: '竖屏 9:16', icon: '📱', desc: '抖音/快手' },
              { id: '16:9', label: '横屏 16:9', icon: '🖥️', desc: 'B站/YouTube' },
              { id: '1:1', label: '方形 1:1', icon: '⬜', desc: '通用' },
            ],
          }),
        ];
      },
    },

    // Step 5: 选BGM — 视频特有
    {
      id: 'bgm',
      field: 'bgm',
      messages: () => [
        sparkText('最后选个BGM风格，我会帮你匹配合适的背景音乐 🎵'),
        sparkSelection({
          title: '背景音乐风格',
          multiple: false,
          columns: 2,
          options: BGM_STYLES.map(b => ({
            id: b,
            label: b,
          })),
        }),
      ],
    },

    // Step 6: 确认
    {
      id: 'confirm',
      field: 'confirmed',
      messages: (collected) => {
        const platformNames = (collected.platforms as string[])
          .map(id => VIDEO_PLATFORMS.find(p => p.platform === id)?.name || id)
          .join('、');
        const styleName = VIDEO_STYLES.find(s => s.id === collected.style)?.label || collected.style;

        return [
          sparkConfirm({
            title: '确认视频方案：',
            summary: [
              { label: '主题', value: (collected.topic as string).slice(0, 30) },
              { label: '平台', value: platformNames },
              { label: '风格', value: styleName },
              { label: '比例', value: collected.ratio as string },
              { label: 'BGM', value: collected.bgm as string },
            ],
            confirmText: '🎬 开始生成脚本',
            cancelText: '改一改',
          }),
        ];
      },
    },

    // Step 7: 生成
    {
      id: 'generate',
      field: '_done',
      messages: (collected) => {
        setTimeout(() => {
          onGenerate(
            collected.topic as string,
            collected.platforms as VideoPlatform[],
            collected.style as VideoStyle,
            collected.ratio as VideoRatio,
            collected.bgm as string,
          );
        }, 100);

        return [
          sparkProgress({
            title: '导演火花正在编写脚本...',
            steps: [
              { label: '分析主题和平台调性', status: 'done' },
              { label: '编写分镜脚本', status: 'running' },
              { label: '规划素材清单', status: 'pending' },
              { label: '生成参考画面', status: 'pending' },
            ],
          }),
        ];
      },
      skip: (collected) => !collected.confirmed,
    },
  ];
}

// ========== 组件 ==========

export function VideoChatPanel({ project, onGenerate, onPhaseChange, isGenerating }: VideoChatPanelProps) {
  const welcomeMessages: ChatMessage[] = [
    { id: chatId(), role: 'spark', type: 'text', text: '你好！我是火花，你的AI视频导演 🎬', timestamp: Date.now() },
    { id: chatId(), role: 'spark', type: 'text', text: '从脚本到分镜到剪辑，全流程帮你搞定。告诉我你想拍什么？', timestamp: Date.now() },
  ];

  const steps = React.useMemo(() => createVideoFlowSteps(onGenerate), [onGenerate]);

  const {
    messages, typing, completed,
    start, handleSend, handleSelect, handleConfirm,
    appendMessages, updateLastProgress,
  } = useChatFlow({
    steps,
    onComplete: () => {},
    initialMessages: welcomeMessages,
  });

  useEffect(() => {
    const timer = setTimeout(() => start(), 800);
    return () => clearTimeout(timer);
  }, []);

  // 生成完成
  useEffect(() => {
    if (project && completed && !isGenerating) {
      updateLastProgress(msg => ({
        ...msg,
        data: {
          title: '脚本生成完成！',
          steps: [
            { label: '分析主题和平台调性', status: 'done' as const },
            { label: '编写分镜脚本', status: 'done' as const },
            { label: '规划素材清单', status: 'done' as const },
            { label: '生成参考画面', status: 'done' as const },
          ],
          progress: 100,
        },
      }));

      appendMessages([
        sparkText(`脚本出炉！共 ${project.scenes.length} 个分镜，预计 ${project.totalDuration} 秒。`),
        sparkText('中间区域可以编辑分镜、上传素材。素材齐了我就帮你自动剪辑出片 🎬'),
      ]);
    }
  }, [project, isGenerating]);

  // 项目阶段变化
  useEffect(() => {
    if (!project) return;

    if (project.phase === 'editing' && project.render.status === 'rendering') {
      appendMessages([
        sparkProgress({
          title: '正在用 FFmpeg 剪辑渲染...',
          steps: [
            { label: '拼接分镜素材', status: 'running' },
            { label: '添加转场效果', status: 'pending' },
            { label: '叠加字幕', status: 'pending' },
            { label: '混合BGM', status: 'pending' },
            { label: '编码输出', status: 'pending' },
          ],
        }),
      ]);
    }

    if (project.phase === 'delivering' && project.render.status === 'done') {
      appendMessages([
        sparkText('视频渲染完成！🎉 右侧可以预览，不满意的话跟我说要调什么。'),
      ]);
    }
  }, [project?.phase, project?.render.status]);

  // 快捷气泡点击
  const handleQuickAction = useCallback((actionId: string) => {
    if (SCENE_TOPICS[actionId]) {
      handleSend(SCENE_TOPICS[actionId]);
      return;
    }
    const actionMessages: Record<string, string> = {
      add_scene: '帮我加一个分镜',
      change_bgm: '帮我换一个BGM风格',
      add_subtitle: '帮我加上字幕',
      speed_up: '节奏快一点，缩短时长',
    };
    if (actionMessages[actionId]) {
      handleSend(actionMessages[actionId]);
    }
  }, [handleSend]);

  return (
    <ChatPanel
      title="短视频创作"
      subtitle="AI 导演 · 脚本到出片全流程"
      icon="🎬"
      accentColor={VIDEO_ACCENT}
      messages={messages}
      onSend={handleSend}
      onSelect={handleSelect}
      onConfirm={handleConfirm}
      onQuickAction={handleQuickAction}
      quickActions={completed ? VIDEO_QUICK_ACTIONS : undefined}
      starterCard={VIDEO_STARTER}
      inputPlaceholder="跟导演火花说点什么..."
      inputDisabled={isGenerating}
      typing={typing || isGenerating}
    />
  );
}
