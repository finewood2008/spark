/**
 * useChatFlow — 对话流程引擎 Hook
 * 
 * 状态机驱动的多轮对话，逐步收集用户配置
 * 支持：文本输入、卡片选择、确认、跳过
 */
import { useState, useCallback, useRef } from 'react';
import {
  ChatMessage, FlowStep, FlowState,
  chatId, sparkText, userText,
} from './types';

interface UseChatFlowOptions {
  steps: FlowStep[];
  onComplete: (collected: Record<string, any>) => void;
  initialMessages?: ChatMessage[];
}

export function useChatFlow({ steps, onComplete, initialMessages = [] }: UseChatFlowOptions) {
  const [state, setState] = useState<FlowState>(() => ({
    flowId: chatId(),
    currentStepIndex: -1,  // -1 表示还没开始
    collected: {},
    messages: [...initialMessages],
    completed: false,
  }));

  const [typing, setTyping] = useState(false);
  const completedRef = useRef(false);

  // 模拟打字延迟后添加消息
  const addMessagesWithDelay = useCallback((
    newMessages: ChatMessage[],
    callback?: () => void,
  ) => {
    setTyping(true);
    const delay = 400 + Math.random() * 400; // 400-800ms

    setTimeout(() => {
      setTyping(false);
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, ...newMessages],
      }));
      callback?.();
    }, delay);
  }, []);

  // 推进到下一步
  const advanceToStep = useCallback((stepIndex: number, collected: Record<string, any>) => {
    // 跳过不需要的步骤
    let idx = stepIndex;
    while (idx < steps.length && steps[idx].skip?.(collected)) {
      idx++;
    }

    if (idx >= steps.length) {
      // 流程完成
      if (!completedRef.current) {
        completedRef.current = true;
        setState(prev => ({ ...prev, completed: true, collected }));
        onComplete(collected);
      }
      return;
    }

    const step = steps[idx];
    const msgs = step.messages(collected);

    addMessagesWithDelay(msgs, () => {
      setState(prev => ({
        ...prev,
        currentStepIndex: idx,
        collected,
      }));
    });
  }, [steps, onComplete, addMessagesWithDelay]);

  // 开始流程
  const start = useCallback(() => {
    completedRef.current = false;
    advanceToStep(0, {});
  }, [advanceToStep]);

  // 重置流程
  const reset = useCallback((keepMessages?: boolean) => {
    completedRef.current = false;
    setState({
      flowId: chatId(),
      currentStepIndex: -1,
      collected: {},
      messages: keepMessages ? [] : [...initialMessages],
      completed: false,
    });
  }, [initialMessages]);

  // 用户发送文本
  const handleSend = useCallback((text: string) => {
    const userMsg = userText(text);
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    const step = steps[state.currentStepIndex];
    if (!step) return;

    // 验证
    const error = step.validate?.(text, state.collected);
    if (error) {
      addMessagesWithDelay([sparkText(error)]);
      return;
    }

    const newCollected = { ...state.collected, [step.field]: text };
    advanceToStep(state.currentStepIndex + 1, newCollected);
  }, [state.currentStepIndex, state.collected, steps, advanceToStep, addMessagesWithDelay]);

  // 用户在卡片中选择
  const handleSelect = useCallback((messageId: string, selected: string[]) => {
    // 标记卡片已回答
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId ? { ...m, answered: true } : m
      ),
    }));

    const step = steps[state.currentStepIndex];
    if (!step) return;

    // 添加用户选择的回显
    const options = (state.messages.find(m => m.id === messageId)?.data as any)?.options || [];
    const labels = selected.map(id => options.find((o: any) => o.id === id)?.label || id);
    const echoMsg = userText(labels.join('、'));
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, echoMsg],
    }));

    const value = selected.length === 1 ? selected[0] : selected;
    const newCollected = { ...state.collected, [step.field]: value };
    advanceToStep(state.currentStepIndex + 1, newCollected);
  }, [state.currentStepIndex, state.collected, state.messages, steps, advanceToStep]);

  // 用户确认/取消
  const handleConfirm = useCallback((messageId: string, confirmed: boolean) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId ? { ...m, answered: true } : m
      ),
    }));

    if (confirmed) {
      const echoMsg = userText('好的，开始吧！');
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, echoMsg],
      }));

      const step = steps[state.currentStepIndex];
      if (!step) return;

      const newCollected = { ...state.collected, [step.field]: true };
      advanceToStep(state.currentStepIndex + 1, newCollected);
    } else {
      // 取消 → 回到第一步重新来
      const restartMsg = sparkText('没问题，我们重新来过。你想做什么内容？');
      addMessagesWithDelay([restartMsg], () => {
        completedRef.current = false;
        setState(prev => ({
          ...prev,
          currentStepIndex: 0,
          collected: {},
          completed: false,
        }));
        advanceToStep(0, {});
      });
    }
  }, [state.currentStepIndex, state.collected, steps, advanceToStep, addMessagesWithDelay]);

  // 手动追加消息（用于外部事件，如生成完成通知）
  const appendMessages = useCallback((msgs: ChatMessage[]) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, ...msgs],
    }));
  }, []);

  // 更新最后一条进度卡片
  const updateLastProgress = useCallback((updater: (msg: ChatMessage) => ChatMessage) => {
    setState(prev => {
      const msgs = [...prev.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].type === 'progress_card') {
          msgs[i] = updater(msgs[i]);
          break;
        }
      }
      return { ...prev, messages: msgs };
    });
  }, []);

  return {
    messages: state.messages,
    collected: state.collected,
    completed: state.completed,
    typing,
    currentStep: state.currentStepIndex >= 0 ? steps[state.currentStepIndex] : null,

    start,
    reset,
    handleSend,
    handleSelect,
    handleConfirm,
    appendMessages,
    updateLastProgress,
  };
}
