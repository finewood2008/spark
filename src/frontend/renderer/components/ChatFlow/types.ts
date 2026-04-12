/**
 * ChatFlow 对话流程系统 — 类型定义
 * 
 * 核心理念：火花是AI数字员工，通过对话引导用户完成任务
 * 消息类型：文本、选择卡片、确认卡片、进度卡片、摘要卡片
 */

// ========== 消息类型 ==========

export type MessageRole = 'spark' | 'user';

export type MessageType =
  | 'text'              // 纯文本
  | 'selection_card'    // 选择卡片（单选/多选）
  | 'confirm_card'      // 确认卡片（是/否 + 摘要）
  | 'progress_card'     // 进度卡片（生成中...）
  | 'summary_card'      // 摘要卡片（配置总览）
  | 'image_card'        // 图片预览卡片
  | 'input_request';    // 请求用户输入

/** 选择项 */
export interface SelectionOption {
  id: string;
  label: string;
  desc?: string;
  icon?: string;
  selected?: boolean;
}

/** 选择卡片数据 */
export interface SelectionCardData {
  title: string;
  options: SelectionOption[];
  multiple: boolean;       // 是否多选
  minSelect?: number;
  maxSelect?: number;
  columns?: 1 | 2 | 3;    // 布局列数
}

/** 确认卡片数据 */
export interface ConfirmCardData {
  title: string;
  summary: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
}

/** 进度卡片数据 */
export interface ProgressCardData {
  title: string;
  steps: { label: string; status: 'pending' | 'running' | 'done' | 'error' }[];
  progress?: number;       // 0-100
}

/** 摘要卡片数据 */
export interface SummaryCardData {
  title: string;
  items: { label: string; value: string; icon?: string }[];
  action?: { label: string; actionId: string };
}

/** 输入请求数据 */
export interface InputRequestData {
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
}

/** 图片卡片数据 */
export interface ImageCardData {
  url: string;
  caption?: string;
  actions?: { label: string; actionId: string }[];
}

/** 单条消息 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  text?: string;
  data?: SelectionCardData | ConfirmCardData | ProgressCardData | SummaryCardData | InputRequestData | ImageCardData;
  timestamp: number;
  
  // 交互状态
  answered?: boolean;      // 卡片是否已回答
  disabled?: boolean;      // 是否禁用交互
}

// ========== 对话流程 ==========

/** 流程步骤定义 */
export interface FlowStep {
  id: string;
  messages: (collected: Record<string, any>) => ChatMessage[];  // 根据已收集数据生成消息
  field: string;           // 收集到哪个字段
  validate?: (value: any, collected: Record<string, any>) => string | null;  // 返回错误信息或null
  skip?: (collected: Record<string, any>) => boolean;  // 是否跳过此步
}

/** 流程定义 */
export interface ChatFlow {
  id: string;
  name: string;
  steps: FlowStep[];
  onComplete: (collected: Record<string, any>) => void;
}

/** 流程状态 */
export interface FlowState {
  flowId: string;
  currentStepIndex: number;
  collected: Record<string, any>;
  messages: ChatMessage[];
  completed: boolean;
}

// ========== 工具函数 ==========

let _counter = 0;
export function chatId(): string {
  return `msg_${Date.now()}_${++_counter}`;
}

/** 快速创建火花文本消息 */
export function sparkText(text: string): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'text', text, timestamp: Date.now() };
}

/** 快速创建用户文本消息 */
export function userText(text: string): ChatMessage {
  return { id: chatId(), role: 'user', type: 'text', text, timestamp: Date.now() };
}

/** 快速创建选择卡片 */
export function sparkSelection(data: SelectionCardData): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'selection_card', data, timestamp: Date.now() };
}

/** 快速创建确认卡片 */
export function sparkConfirm(data: ConfirmCardData): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'confirm_card', data, timestamp: Date.now() };
}

/** 快速创建进度卡片 */
export function sparkProgress(data: ProgressCardData): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'progress_card', data, timestamp: Date.now() };
}

/** 快速创建摘要卡片 */
export function sparkSummary(data: SummaryCardData): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'summary_card', data, timestamp: Date.now() };
}

/** 快速创建输入请求 */
export function sparkInput(text: string, data: InputRequestData): ChatMessage {
  return { id: chatId(), role: 'spark', type: 'input_request', text, data, timestamp: Date.now() };
}
