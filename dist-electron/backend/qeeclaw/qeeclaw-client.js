"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QeeClawBridge = void 0;
/** 动态加载 ESM SDK（CJS 环境下用 dynamic import） */
async function loadSDK() {
    // dynamic import 在 CJS 中也能加载 ESM
    const mod = await Promise.resolve().then(() => __importStar(require('../qeeclaw-core-sdk/dist/index.js')));
    return mod;
}
class QeeClawBridge {
    constructor(config) {
        this._online = false;
        this._ready = false;
        this._config = config;
        this._teamId = config.teamId;
        this._localFallback = config.localFallback ?? true;
    }
    /** 异步初始化（加载 ESM SDK） */
    async _init() {
        const { createQeeClawClient } = await loadSDK();
        this.sdk = createQeeClawClient({
            baseUrl: this._config.baseUrl,
            token: this._config.token,
            timeoutMs: this._config.timeoutMs ?? 10000,
        });
        this._ready = true;
    }
    /** 初始化单例（异步） */
    static async init(config) {
        if (!QeeClawBridge.instance) {
            const bridge = new QeeClawBridge(config);
            await bridge._init();
            QeeClawBridge.instance = bridge;
        }
        return QeeClawBridge.instance;
    }
    /** 获取已初始化的单例 */
    static get() {
        if (!QeeClawBridge.instance || !QeeClawBridge.instance._ready) {
            throw new Error('[QeeClawBridge] 尚未初始化，请先 await QeeClawBridge.init()');
        }
        return QeeClawBridge.instance;
    }
    /** 销毁单例（测试用） */
    static destroy() {
        QeeClawBridge.instance = null;
    }
    /** 检测平台连通性 */
    async ping() {
        try {
            await this.sdk.models.listAvailable();
            this._online = true;
            return true;
        }
        catch {
            this._online = false;
            return false;
        }
    }
    get online() { return this._online; }
    get teamId() { return this._teamId; }
    // ─── 模块快捷访问 ───────────────────────────────
    get memory() { return this.sdk.memory; }
    get knowledge() { return this.sdk.knowledge; }
    get models() { return this.sdk.models; }
    get conversations() { return this.sdk.conversations; }
    get channels() { return this.sdk.channels; }
    get billing() { return this.sdk.billing; }
    get iam() { return this.sdk.iam; }
    get apikey() { return this.sdk.apikey; }
    get tenant() { return this.sdk.tenant; }
    get devices() { return this.sdk.devices; }
    get audit() { return this.sdk.audit; }
    get policy() { return this.sdk.policy; }
    get approval() { return this.sdk.approval; }
    get agent() { return this.sdk.agent; }
    get file() { return this.sdk.file; }
    get voice() { return this.sdk.voice; }
    get workflow() { return this.sdk.workflow; }
    // ─── 带 teamId 的便捷方法 ──────────────────────
    /** 存储一条记忆 */
    async storeMemory(content, category, importance) {
        return this.sdk.memory.store({
            content,
            category: category ?? 'preference',
            importance: importance ?? 5,
            teamId: this._teamId,
        });
    }
    /** 搜索记忆 */
    async searchMemory(query, limit = 10) {
        return this.sdk.memory.search({
            query,
            limit,
            teamId: this._teamId,
        });
    }
    /** 搜索知识库 */
    async searchKnowledge(query, limit = 5) {
        return this.sdk.knowledge.search({
            query,
            limit,
            teamId: this._teamId,
        });
    }
    /** 上传知识文档（文本） */
    async ingestKnowledge(content, sourceName) {
        return this.sdk.knowledge.ingest({
            content,
            sourceName,
            teamId: this._teamId,
        });
    }
    /** 获取可用模型列表 */
    async listModels() {
        return this.sdk.models.listAvailable();
    }
    /** 解析最佳模型 */
    async resolveModel(preferred) {
        return this.sdk.models.resolveForAgent(preferred);
    }
    /** 调用模型（文本补全） */
    async invokeModel(prompt, model) {
        return this.sdk.models.invoke({ prompt, model });
    }
}
exports.QeeClawBridge = QeeClawBridge;
QeeClawBridge.instance = null;
