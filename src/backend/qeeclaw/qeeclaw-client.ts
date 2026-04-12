/**
 * QeeClawBridge - 火花项目与 QeeClaw 平台的统一接入层
 *
 * 职责：
 * 1. 初始化 QeeClawCoreSDK 单例
 * 2. 暴露 memory / knowledge / models / conversations / channels 模块
 * 3. 提供 teamId 上下文，避免每次调用都传
 * 4. 本地 fallback：当平台不可达时降级到本地文件存储
 *
 * 注意：SDK 是 ESM 包，火花 Electron 端是 CJS，这里用 dynamic import 桥接。
 */

// 类型只从 .d.ts 引入（不产生运行时 require）
import type { QeeClawCoreSDK } from '../qeeclaw-core-sdk/dist/index';
import type { QeeClawClientOptions } from '../qeeclaw-core-sdk/dist/types';
import type { MemoryModule, MemoryStoreRequest, MemorySearchRequest } from '../qeeclaw-core-sdk/dist/modules/memory';
import type { KnowledgeModule, KnowledgeSearchRequest, KnowledgeIngestRequest } from '../qeeclaw-core-sdk/dist/modules/knowledge';
import type { ModelsModule, QeeClawModelInfo, ModelInvokeRequest, ModelInvokeResult, ModelStreamRequest } from '../qeeclaw-core-sdk/dist/modules/models';
import type { ConversationsModule } from '../qeeclaw-core-sdk/dist/modules/conversations';
import type { ChannelsModule } from '../qeeclaw-core-sdk/dist/modules/channels';
import type { BillingModule } from '../qeeclaw-core-sdk/dist/modules/billing';
import type { IamModule } from '../qeeclaw-core-sdk/dist/modules/iam';
import type { ApiKeyModule } from '../qeeclaw-core-sdk/dist/modules/apikey';
import type { TenantModule } from '../qeeclaw-core-sdk/dist/modules/tenant';
import type { DevicesModule } from '../qeeclaw-core-sdk/dist/modules/devices';
import type { AuditModule } from '../qeeclaw-core-sdk/dist/modules/audit';
import type { PolicyModule } from '../qeeclaw-core-sdk/dist/modules/policy';
import type { ApprovalModule } from '../qeeclaw-core-sdk/dist/modules/approval';
import type { AgentModule } from '../qeeclaw-core-sdk/dist/modules/agent';
import type { FileModule } from '../qeeclaw-core-sdk/dist/modules/file';
import type { VoiceModule } from '../qeeclaw-core-sdk/dist/modules/voice';
import type { WorkflowModule } from '../qeeclaw-core-sdk/dist/modules/workflow';

// Re-export useful types for consumers
export type {
  QeeClawModelInfo,
  MemoryStoreRequest,
  MemorySearchRequest,
  KnowledgeSearchRequest,
  KnowledgeIngestRequest,
  ModelInvokeRequest,
  ModelInvokeResult,
  ModelStreamRequest,
};

export interface QeeClawBridgeConfig {
  /** QeeClaw 平台 API 地址 */
  baseUrl: string;
  /** Bearer token */
  token: string;
  /** 当前团队 ID */
  teamId: number;
  /** 可选：超时毫秒数 */
  timeoutMs?: number;
  /** 可选：是否启用本地 fallback（默认 true） */
  localFallback?: boolean;
}

/** 动态加载 ESM SDK（CJS 环境下用 dynamic import） */
async function loadSDK(): Promise<{ createQeeClawClient: (opts: QeeClawClientOptions) => QeeClawCoreSDK }> {
  // dynamic import 在 CJS 中也能加载 ESM
  const mod = await import('../qeeclaw-core-sdk/dist/index.js');
  return mod;
}

export class QeeClawBridge {
  private static instance: QeeClawBridge | null = null;

  private sdk!: QeeClawCoreSDK;
  private _teamId: number;
  private _online: boolean = false;
  private _localFallback: boolean;
  private _ready: boolean = false;
  private _config: QeeClawBridgeConfig;

  private constructor(config: QeeClawBridgeConfig) {
    this._config = config;
    this._teamId = config.teamId;
    this._localFallback = config.localFallback ?? true;
  }

  /** 异步初始化（加载 ESM SDK） */
  private async _init(): Promise<void> {
    const { createQeeClawClient } = await loadSDK();
    this.sdk = createQeeClawClient({
      baseUrl: this._config.baseUrl,
      token: this._config.token,
      timeoutMs: this._config.timeoutMs ?? 10000,
    });
    this._ready = true;
  }

  /** 初始化单例（异步） */
  static async init(config: QeeClawBridgeConfig): Promise<QeeClawBridge> {
    if (!QeeClawBridge.instance) {
      const bridge = new QeeClawBridge(config);
      await bridge._init();
      QeeClawBridge.instance = bridge;
    }
    return QeeClawBridge.instance;
  }

  /** 获取已初始化的单例 */
  static get(): QeeClawBridge {
    if (!QeeClawBridge.instance || !QeeClawBridge.instance._ready) {
      throw new Error('[QeeClawBridge] 尚未初始化，请先 await QeeClawBridge.init()');
    }
    return QeeClawBridge.instance;
  }

  /** 销毁单例（测试用） */
  static destroy(): void {
    QeeClawBridge.instance = null;
  }

  /** 检测平台连通性 */
  async ping(): Promise<boolean> {
    try {
      await this.sdk.models.listAvailable();
      this._online = true;
      return true;
    } catch {
      this._online = false;
      return false;
    }
  }

  get online(): boolean { return this._online; }
  get teamId(): number { return this._teamId; }

  // ─── 模块快捷访问 ───────────────────────────────

  get memory(): MemoryModule { return this.sdk.memory; }
  get knowledge(): KnowledgeModule { return this.sdk.knowledge; }
  get models(): ModelsModule { return this.sdk.models; }
  get conversations(): ConversationsModule { return this.sdk.conversations; }
  get channels(): ChannelsModule { return this.sdk.channels; }
  get billing(): BillingModule { return this.sdk.billing; }
  get iam(): IamModule { return this.sdk.iam; }
  get apikey(): ApiKeyModule { return this.sdk.apikey; }
  get tenant(): TenantModule { return this.sdk.tenant; }
  get devices(): DevicesModule { return this.sdk.devices; }
  get audit(): AuditModule { return this.sdk.audit; }
  get policy(): PolicyModule { return this.sdk.policy; }
  get approval(): ApprovalModule { return this.sdk.approval; }
  get agent(): AgentModule { return this.sdk.agent; }
  get file(): FileModule { return this.sdk.file; }
  get voice(): VoiceModule { return this.sdk.voice; }
  get workflow(): WorkflowModule { return this.sdk.workflow; }

  // ─── 带 teamId 的便捷方法 ──────────────────────

  /** 存储一条记忆 */
  async storeMemory(content: string, category?: MemoryStoreRequest['category'], importance?: number): Promise<Record<string, unknown>> {
    return this.sdk.memory.store({
      content,
      category: category ?? 'preference',
      importance: importance ?? 5,
      teamId: this._teamId,
    });
  }

  /** 搜索记忆 */
  async searchMemory(query: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    return this.sdk.memory.search({
      query,
      limit,
      teamId: this._teamId,
    });
  }

  /** 搜索知识库 */
  async searchKnowledge(query: string, limit: number = 5): Promise<Record<string, unknown>> {
    return this.sdk.knowledge.search({
      query,
      limit,
      teamId: this._teamId,
    });
  }

  /** 上传知识文档（文本） */
  async ingestKnowledge(content: string, sourceName: string): Promise<Record<string, unknown>> {
    return this.sdk.knowledge.ingest({
      content,
      sourceName,
      teamId: this._teamId,
    });
  }

  /** 获取可用模型列表 */
  async listModels(): Promise<QeeClawModelInfo[]> {
    return this.sdk.models.listAvailable();
  }

  /** 解析最佳模型 */
  async resolveModel(preferred?: string): Promise<QeeClawModelInfo | null> {
    return this.sdk.models.resolveForAgent(preferred);
  }

  /** 调用模型（文本补全） */
  async invokeModel(prompt: string, model?: string): Promise<ModelInvokeResult> {
    return this.sdk.models.invoke({ prompt, model });
  }
}
