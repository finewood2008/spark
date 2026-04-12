/**
 * VideoStudio 类型定义（重构版）
 * 
 * 核心理念：火花是"自动导演"
 * 流程：立项 → 脚本分镜 → 素材收集 → 自动剪辑 → 微调交付
 */

// ========== 基础枚举 ==========

export type VideoPlatform = 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'shipinhao' | 'tiktok';
export type VideoStyle = 'talking_head' | 'product_showcase' | 'slideshow' | 'text_animation' | 'vlog';
export type VideoRatio = '9:16' | '16:9' | '1:1';

/** 项目五阶段 */
export type ProjectPhase = 'planning' | 'scripting' | 'collecting' | 'editing' | 'delivering';

/** 素材类型 */
export type MaterialType = 'video_clip' | 'image' | 'audio' | 'voiceover' | 'bgm' | 'text_overlay' | 'logo' | 'subtitle';

/** 素材来源 */
export type MaterialSource = 'user_upload' | 'ai_generated' | 'brand_asset' | 'stock' | 'recorded';

/** 素材状态 */
export type MaterialStatus = 'required' | 'uploading' | 'ready' | 'generating' | 'failed' | 'optional';

/** 剪辑转场类型 */
export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'slide_left' | 'slide_right' | 'zoom_in' | 'zoom_out' | 'wipe';

/** 字幕样式 */
export type SubtitlePosition = 'bottom_center' | 'top_center' | 'center' | 'bottom_left';

/** 渲染状态 */
export type RenderStatus = 'idle' | 'preparing' | 'rendering' | 'encoding' | 'done' | 'failed';

// ========== 素材系统 ==========

/** 单个素材 */
export interface Material {
  id: string;
  type: MaterialType;
  source: MaterialSource;
  status: MaterialStatus;
  label: string;              // 显示名："产品正面图"、"口播录音"
  description?: string;       // 补充说明
  filePath?: string;          // 本地文件路径
  fileUrl?: string;           // 远程URL
  thumbnailUrl?: string;      // 缩略图
  duration?: number;          // 音视频时长（秒）
  width?: number;
  height?: number;
  fileSize?: number;          // 字节
  mimeType?: string;
  addedAt: number;
}

/** 分镜素材槽位 — 每个分镜需要哪些素材 */
export interface MaterialSlot {
  id: string;
  sceneId: string;            // 所属分镜
  type: MaterialType;
  label: string;              // "主画面"、"背景音"、"口播"
  required: boolean;
  materialId?: string;        // 已绑定的素材ID
  fallback?: string;          // 缺素材时的兜底方案描述
}

// ========== 分镜系统 ==========

/** 单个分镜 */
export interface SceneBlock {
  id: string;
  order: number;
  duration: number;           // 秒
  narration: string;          // 口播/旁白文案
  visualDesc: string;         // 画面描述（给AI或给用户的拍摄指导）
  imageUrl?: string;          // AI生成的参考画面
  generating?: boolean;

  // 新增：素材槽位
  slots: MaterialSlot[];

  // 新增：剪辑指令
  transition: TransitionType; // 进入转场
  kenBurns?: boolean;         // 图片是否做缩放动画
  textOverlay?: string;       // 画面上的文字
  textPosition?: 'top' | 'center' | 'bottom';
  filter?: string;            // 滤镜名
}

/** 视频项目 */
export interface VideoProject {
  id: string;
  title: string;
  hook: string;               // 前3秒钩子
  scenes: SceneBlock[];
  bgmStyle: string;
  subtitleStyle: SubtitlePosition;
  ratio: VideoRatio;
  style: VideoStyle;
  platforms: VideoPlatform[];
  totalDuration: number;
  createdAt: number;
  updatedAt: number;

  // 新增：项目阶段
  phase: ProjectPhase;

  // 新增：素材池
  materials: Material[];

  // 新增：就绪度
  readiness: {
    totalSlots: number;
    filledSlots: number;
    percentage: number;
  };

  // 新增：渲染状态
  render: {
    status: RenderStatus;
    progress: number;         // 0-100
    outputPath?: string;
    outputSize?: number;
    error?: string;
    startedAt?: number;
    finishedAt?: number;
  };
}

// ========== 剪辑引擎指令 ==========

/** 发送给后端 video-engine 的剪辑指令 */
export interface EditCommand {
  projectId: string;
  outputPath: string;
  ratio: VideoRatio;
  fps: number;
  resolution: { width: number; height: number };

  timeline: TimelineTrack[];
  subtitles?: SubtitleTrack;
  bgm?: BgmTrack;
  watermark?: WatermarkConfig;
}

export interface TimelineTrack {
  sceneId: string;
  order: number;
  startTime: number;          // 在总时间线上的起始秒
  duration: number;
  clips: ClipItem[];
  transition: TransitionType;
  transitionDuration: number; // 转场时长（秒）
}

export interface ClipItem {
  materialId: string;
  type: MaterialType;
  filePath: string;
  inPoint: number;            // 素材内的起始点
  outPoint: number;           // 素材内的结束点
  volume?: number;            // 0-1
  opacity?: number;           // 0-1
  position?: { x: number; y: number };
  scale?: number;
  kenBurns?: { startScale: number; endScale: number };
  filter?: string;
}

export interface SubtitleTrack {
  style: SubtitlePosition;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  entries: { startTime: number; endTime: number; text: string }[];
}

export interface BgmTrack {
  filePath: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface WatermarkConfig {
  type: 'image' | 'text';
  content: string;            // 文件路径或文字
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  opacity: number;
  scale: number;
}

// ========== 平台信息 ==========

export interface VideoPlatformInfo {
  platform: VideoPlatform;
  name: string;
  icon: string;
  maxDuration: number;
  ratios: VideoRatio[];
  features: string[];
  resolution: { width: number; height: number }; // 推荐分辨率
}

export const VIDEO_PLATFORMS: VideoPlatformInfo[] = [
  { platform: 'douyin',       name: '抖音',   icon: '抖', maxDuration: 600,  ratios: ['9:16', '16:9'], features: ['竖屏优先', '前3秒钩子', '字幕'],   resolution: { width: 1080, height: 1920 } },
  { platform: 'kuaishou',     name: '快手',   icon: '快', maxDuration: 600,  ratios: ['9:16', '16:9'], features: ['接地气', '真实感', '互动'],         resolution: { width: 1080, height: 1920 } },
  { platform: 'xiaohongshu',  name: '小红书', icon: '红', maxDuration: 300,  ratios: ['9:16', '1:1'],  features: ['精致感', '种草', '教程'],           resolution: { width: 1080, height: 1920 } },
  { platform: 'bilibili',     name: 'B站',    icon: 'B',  maxDuration: 3600, ratios: ['16:9', '9:16'], features: ['横屏为主', '深度内容', '弹幕'],     resolution: { width: 1920, height: 1080 } },
  { platform: 'shipinhao',    name: '视频号', icon: '视', maxDuration: 1800, ratios: ['9:16', '16:9', '1:1'], features: ['微信生态', '私域', '直播'], resolution: { width: 1080, height: 1920 } },
  { platform: 'tiktok',       name: 'TikTok', icon: 'T',  maxDuration: 600,  ratios: ['9:16'],         features: ['全球化', '病毒传播', '趋势'],       resolution: { width: 1080, height: 1920 } },
];

export const VIDEO_STYLES: { id: VideoStyle; label: string; desc: string; icon: string }[] = [
  { id: 'talking_head',     label: '口播讲解', desc: '真人出镜讲解',       icon: '🎙️' },
  { id: 'product_showcase', label: '产品展示', desc: '产品特写+功能演示',   icon: '📦' },
  { id: 'slideshow',        label: '图文轮播', desc: '图片+文字+转场动画', icon: '🖼️' },
  { id: 'text_animation',   label: '文字动画', desc: '纯文字+动效+BGM',   icon: '✨' },
  { id: 'vlog',             label: 'Vlog风格', desc: '生活化记录+旁白',   icon: '📹' },
];

export const BGM_STYLES = [
  '轻快活泼', '商务大气', '温暖治愈', '科技感', '激昂励志', '安静舒缓',
];

export const TRANSITION_OPTIONS: { id: TransitionType; label: string }[] = [
  { id: 'cut',         label: '硬切' },
  { id: 'fade',        label: '淡入淡出' },
  { id: 'dissolve',    label: '溶解' },
  { id: 'slide_left',  label: '左滑' },
  { id: 'slide_right', label: '右滑' },
  { id: 'zoom_in',     label: '放大' },
  { id: 'zoom_out',    label: '缩小' },
  { id: 'wipe',        label: '擦除' },
];

/** 阶段信息 */
export const PHASE_INFO: Record<ProjectPhase, { label: string; icon: string; desc: string }> = {
  planning:   { label: '立项',   icon: '📋', desc: '确定主题、平台、风格' },
  scripting:  { label: '脚本',   icon: '✍️', desc: 'AI生成分镜脚本和素材清单' },
  collecting: { label: '素材',   icon: '📁', desc: '上传素材或AI生成，凑齐清单' },
  editing:    { label: '剪辑',   icon: '🎬', desc: 'FFmpeg自动剪辑渲染' },
  delivering: { label: '交付',   icon: '🚀', desc: '预览、微调、导出' },
};
