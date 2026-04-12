/**
 * ContentChatPanel — 图文创作对话面板
 * 
 * 产品形态：AI写手 / 内容编辑
 * 调性：温暖橙色、文字感、编辑部氛围
 * 核心差异：围绕"写"展开 — 选题、文风、排版、配图
 */
import React, { useEffect, useCallback } from 'react';
import {
  ChatPanel, useChatFlow,
  sparkText, sparkSelection, sparkConfirm, sparkInput, sparkProgress,
  FlowStep, ChatMessage, chatId,
  QuickAction, StarterCard,
} from '../../components/ChatFlow';
import { TargetPlatform, PLATFORM_LIST, STYLE_OPTIONS } from './types';

// ========== 图文专属配置 ==========

const CONTENT_ACCENT = '#FF8C42';  // 暖橙 — 区别于视频的红橙

/** 初始选项卡 — 图文场景 */
const CONTENT_STARTER: StarterCard = {
  title: '今天想写点什么？',
  desc: '选一个场景快速开始，或者直接告诉我你的想法',
  options: [
    { id: 'product_launch', label: '新品发布 — 写一篇产品介绍', icon: '🚀' },
    { id: 'industry_insight', label: '行业洞察 — 写一篇深度分析', icon: '📊' },
    { id: 'brand_story', label: '品牌故事 — 讲一个有温度的故事', icon: '📖' },
    { id: 'social_post', label: '社交种草 — 小红书/朋友圈文案', icon: '✨' },
    { id: 'newsletter', label: '公众号推文 — 图文并茂的长文', icon: '📝' },
  ],
};

/** 悬浮快捷气泡 — 图文常用操作 */
const CONTENT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'rewrite', label: '换个写法', icon: '🔄' },
  { id: 'shorter', label: '精简一下', icon: '✂️' },
  { id: 'add_image', label: '配张图', icon: '🖼️' },
  { id: 'change_tone', label: '换个语气', icon: '🎭' },
];

/** 场景预设主题 */
const SCENE_TOPICS: Record<string, string> = {
  product_launch: '新品发布推广',
  industry_insight: '行业趋势深度分析',
  brand_story: '品牌故事',
  social_post: '社交媒体种草文案',
  newsletter: '公众号图文推送',
};

// ========== 对话流程 ==========

interface ContentChatPanelProps {
  onGenerate: (topic: string, platforms: TargetPlatform[], style: string) => void;
  isGenerating: boolean;
}

function createContentFlowSteps(onGenerate: ContentChatPanelProps['onGenerate']): FlowStep[] {
  return [
    // Step 1: 问主题
    {
      id: 'topic',
      field: 'topic',
      messages: () => [
        sparkInput('想写什么内容？给我一个主题或方向，越具体越好。比如"新款蓝牙耳机发布"、"2026年AI行业趋势"。', {
          placeholder: '输入你想写的主题...',
          multiline: true,
        }),
      ],
      validate: (value) => {
        if (typeof value === 'string' && value.trim().length < 2) {
          return '主题太短了，再多说几个字让我更好理解你的需求 😊';
        }
        return null;
      },
    },

    // Step 2: 选平台 — 图文平台
    {
      id: 'platforms',
      field: 'platforms',
      messages: (collected) => [
        sparkText(`"${(collected.topic as string).slice(0, 20)}"，好选题 👍 我来帮你写。`),
        sparkSelection({
          title: '这篇文章要发到哪里？不同平台我会调整篇幅和排版',
          multiple: true,
          minSelect: 1,
          columns: 2,
          options: PLATFORM_LIST.map(p => ({
            id: p.platform,
            label: p.name,
            icon: p.icon,
            desc: p.features[0],
          })),
        }),
      ],
      validate: (value) => {
        if (Array.isArray(value) && value.length === 0) {
          return '至少选一个平台哦';
        }
        return null;
      },
    },

    // Step 3: 选文风 — 图文特有
    {
      id: 'style',
      field: 'style',
      messages: (collected) => {
        const platforms = collected.platforms as string[];
        const isXiaohongshu = platforms.includes('xiaohongshu');
        const isWechat = platforms.includes('wechat');
        let hint = '你想要什么文风？';
        if (isXiaohongshu) hint = '小红书的话，轻松活泼的风格更容易种草 ✨';
        else if (isWechat) hint = '公众号长文，专业深度的风格更有说服力';

        return [
          sparkText(hint),
          sparkSelection({
            title: '选一个最合适的',
            multiple: false,
            columns: 1,
            options: STYLE_OPTIONS.map(s => ({
              id: s.id,
              label: s.label,
              desc: s.desc,
            })),
          }),
        ];
      },
    },

    // Step 4: 确认
    {
      id: 'confirm',
      field: 'confirmed',
      messages: (collected) => {
        const platformNames = (collected.platforms as string[])
          .map(id => PLATFORM_LIST.find(p => p.platform === id)?.name || id)
          .join('、');
        const styleName = STYLE_OPTIONS.find(s => s.id === collected.style)?.label || collected.style;

        return [
          sparkConfirm({
            title: '确认一下，我帮你写：',
            summary: [
              { label: '主题', value: (collected.topic as string).slice(0, 30) },
              { label: '发布平台', value: platformNames },
              { label: '文风', value: styleName },
            ],
            confirmText: '✍️ 开始写作',
            cancelText: '改一改',
          }),
        ];
      },
    },

    // Step 5: 生成
    {
      id: 'generate',
      field: '_done',
      messages: (collected) => {
        setTimeout(() => onGenerate(
          collected.topic as string,
          collected.platforms as TargetPlatform[],
          collected.style as string,
        ), 100);

        return [
          sparkProgress({
            title: '火花正在写作中...',
            steps: [
              { label: '构思大纲和结构', status: 'done' },
              { label: '撰写正文内容', status: 'running' },
              { label: '生成配图', status: 'pending' },
              { label: '适配各平台排版', status: 'pending' },
            ],
          }),
        ];
      },
      skip: (collected) => !collected.confirmed,
    },
  ];
}

// ========== 组件 ==========

export function ContentChatPanel({ onGenerate, isGenerating }: ContentChatPanelProps) {
  const welcomeMessages: ChatMessage[] = [
    { id: chatId(), role: 'spark', type: 'text', text: '你好！我是火花，你的AI写手 ✍️', timestamp: Date.now() },
    { id: chatId(), role: 'spark', type: 'text', text: '不管是公众号长文、小红书种草还是朋友圈文案，交给我就好。', timestamp: Date.now() },
  ];

  const steps = React.useMemo(() => createContentFlowSteps(onGenerate), [onGenerate]);

  const {
    messages, typing, completed,
    start, handleSend, handleSelect, handleConfirm,
    appendMessages, updateLastProgress,
  } = useChatFlow({
    steps,
    onComplete: () => {},
    initialMessages: welcomeMessages,
  });

  // 首次自动开始
  useEffect(() => {
    const timer = setTimeout(() => start(), 800);
    return () => clearTimeout(timer);
  }, []);

  // 生成完成后更新
  useEffect(() => {
    if (completed && !isGenerating) {
      updateLastProgress(msg => ({
        ...msg,
        data: {
          title: '写作完成！',
          steps: [
            { label: '构思大纲和结构', status: 'done' as const },
            { label: '撰写正文内容', status: 'done' as const },
            { label: '生成配图', status: 'done' as const },
            { label: '适配各平台排版', status: 'done' as const },
          ],
          progress: 100,
        },
      }));
      appendMessages([
        sparkText('文章写好了！你可以在右边编辑和预览。觉得哪里不满意随时跟我说，我帮你改 ✍️'),
      ]);
    }
  }, [isGenerating]);

  // 快捷气泡点击
  const handleQuickAction = useCallback((actionId: string) => {
    // 场景预设 → 直接填入主题
    if (SCENE_TOPICS[actionId]) {
      handleSend(SCENE_TOPICS[actionId]);
      return;
    }
    // 编辑操作
    const actionMessages: Record<string, string> = {
      rewrite: '帮我换个写法，保持核心意思不变',
      shorter: '帮我精简一下，去掉冗余的部分',
      add_image: '帮我配一张合适的图片',
      change_tone: '帮我换个语气，更轻松一些',
    };
    if (actionMessages[actionId]) {
      handleSend(actionMessages[actionId]);
    }
  }, [handleSend]);

  const currentStep = messages.length > 0 ? messages[messages.length - 1] : null;
  const waitingForInput = currentStep?.type === 'input_request' && !currentStep.answered;

  return (
    <ChatPanel
      title="图文创作"
      subtitle="AI 写手 · 一键生成多平台图文"
      icon="✍"
      accentColor={CONTENT_ACCENT}
      messages={messages}
      onSend={handleSend}
      onSelect={handleSelect}
      onConfirm={handleConfirm}
      onQuickAction={handleQuickAction}
      quickActions={completed ? CONTENT_QUICK_ACTIONS : undefined}
      starterCard={CONTENT_STARTER}
      inputPlaceholder={waitingForInput ? '输入你想写的主题...' : '跟火花说点什么...'}
      inputDisabled={isGenerating}
      typing={typing || isGenerating}
    />
  );
}
