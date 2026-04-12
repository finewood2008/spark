"use strict";
/**
 * MemorySystem - 记忆与自我进化系统
 *
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 SDK memory 模块同步到云端
 *   2. 本地模式（fallback）— 文件存储
 *
 * 学习用户偏好，积累品牌知识，实现越用越懂你
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
exports.MemorySystem = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const qeeclaw_client_1 = require("../qeeclaw/qeeclaw-client");
class MemorySystem {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.memoryData = this.initMemoryData();
    }
    initMemoryData() {
        return {
            preferences: {
                writingStyle: [], platforms: [], contentTypes: [], brandVoices: [], colorPreferences: [],
                excludedTopics: [], negativePrompts: [], positivePrompts: [], feedbackHistory: [],
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            },
            brandMemories: {}, interactionHistory: [],
        };
    }
    // ─── 平台同步辅助 ──────────────────────────────
    getBridge() {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return bridge.online ? bridge : null;
        }
        catch {
            return null;
        }
    }
    /** 将本地记忆条目同步到平台 */
    async syncToPlatform(content, category = 'preference', importance = 5) {
        const bridge = this.getBridge();
        if (!bridge)
            return;
        try {
            await bridge.storeMemory(content, category, importance);
        }
        catch (e) {
            console.warn('[MemorySystem] 平台同步失败，仅保留本地:', e);
        }
    }
    /** 从平台搜索记忆 */
    async searchPlatformMemory(query, limit = 10) {
        const bridge = this.getBridge();
        if (!bridge)
            return [];
        try {
            return await bridge.searchMemory(query, limit);
        }
        catch {
            return [];
        }
    }
    // ─── 核心方法（保持原有接口不变） ─────────────
    async recordInteraction(record) {
        const interaction = { ...record, id: (0, uuid_1.v4)(), timestamp: new Date().toISOString() };
        this.memoryData.interactionHistory.push(interaction);
        if (this.memoryData.interactionHistory.length > 1000)
            this.memoryData.interactionHistory = this.memoryData.interactionHistory.slice(-1000);
        await this.save();
        // 异步同步到平台（不阻塞）
        this.syncToPlatform(`[interaction] ${record.type}: ${record.intent}`, 'fact', 3).catch(() => { });
    }
    async recordFeedback(contentId, action, feedback, diffSummary) {
        const record = {
            id: (0, uuid_1.v4)(), contentId, action, feedback, diffSummary, createdAt: new Date().toISOString(),
        };
        this.memoryData.preferences.feedbackHistory.push(record);
        if (this.memoryData.preferences.feedbackHistory.length > 500)
            this.memoryData.preferences.feedbackHistory = this.memoryData.preferences.feedbackHistory.slice(-500);
        this.memoryData.preferences.updatedAt = new Date().toISOString();
        await this.save();
        if (feedback || diffSummary) {
            await this.adjustPreferences(action, feedback, diffSummary);
        }
        // 同步反馈到平台
        const syncContent = `[feedback:${action}] ${feedback || diffSummary || contentId}`;
        const category = action === 'reject' ? 'decision' : 'preference';
        this.syncToPlatform(syncContent, category, action === 'reject' ? 8 : 5).catch(() => { });
    }
    async adjustPreferences(action, feedback, diffSummary) {
        const prefs = this.memoryData.preferences;
        if (action === 'reject' && feedback) {
            prefs.negativePrompts.push(feedback);
            if (prefs.negativePrompts.length > 20)
                prefs.negativePrompts.shift();
        }
        if (action === 'edit' && feedback) {
            prefs.positivePrompts.push(`用户更正: ${feedback}`);
            if (prefs.positivePrompts.length > 20)
                prefs.positivePrompts.shift();
        }
        if (action === 'accept' && feedback) {
            prefs.positivePrompts.push(`成功经验: ${feedback}`);
            if (prefs.positivePrompts.length > 20)
                prefs.positivePrompts.shift();
        }
        await this.save();
    }
    /**
     * 获取进化指令：合并本地偏好 + 平台记忆
     * 调用方如果在非 async 上下文可继续用同步签名（返回 Promise 也可 await）
     */
    async getEvolutionDirectives(query) {
        const prefs = this.memoryData.preferences;
        let directive = '';
        if (prefs.negativePrompts.length > 0) {
            directive += `\n【系统红线(禁忌)】:\n- ${prefs.negativePrompts.slice(-5).join('\n- ')}`;
        }
        if (prefs.positivePrompts.length > 0) {
            directive += `\n【成功经验(偏好)】:\n- ${prefs.positivePrompts.slice(-5).join('\n- ')}`;
        }
        // 从平台记忆中检索相关条目并合并
        try {
            const searchQuery = query || '用户偏好 品牌 风格';
            const platformMems = await this.searchPlatformMemory(searchQuery, 5);
            if (platformMems.length > 0) {
                const items = platformMems.map(m => {
                    const content = m.content || JSON.stringify(m);
                    return `- ${content}`;
                }).join('\n');
                directive += `\n【平台记忆】:\n${items}`;
            }
        }
        catch {
            // 平台不可用，仅使用本地偏好
        }
        return directive;
    }
    getPreferences() { return this.memoryData.preferences; }
    async updatePreferences(updates) {
        this.memoryData.preferences = { ...this.memoryData.preferences, ...updates, updatedAt: new Date().toISOString() };
        await this.save();
    }
    async createBrandMemory(brand) {
        const brandMemory = { ...brand, id: (0, uuid_1.v4)(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.memoryData.brandMemories[brandMemory.id] = brandMemory;
        await this.save();
        // 品牌信息同步到平台（高重要性）
        this.syncToPlatform(`[brand] ${brand.name} | ${brand.industry} | voice: ${brand.voice}`, 'entity', 9).catch(() => { });
        return brandMemory;
    }
    getBrandMemory(brandId) { return this.memoryData.brandMemories[brandId] || null; }
    async updateBrandMemory(brandId, updates) {
        const existing = this.memoryData.brandMemories[brandId];
        if (!existing)
            return null;
        this.memoryData.brandMemories[brandId] = { ...existing, ...updates, id: brandId, updatedAt: new Date().toISOString() };
        await this.save();
        return this.memoryData.brandMemories[brandId];
    }
    async deleteBrandMemory(brandId) {
        if (this.memoryData.brandMemories[brandId]) {
            delete this.memoryData.brandMemories[brandId];
            await this.save();
            return true;
        }
        return false;
    }
    getAllBrandMemories() { return Object.values(this.memoryData.brandMemories); }
    getInteractionHistory(limit = 100) { return this.memoryData.interactionHistory.slice(-limit); }
    async save() {
        try {
            await fs.ensureDir(this.dataPath);
            await fs.writeJson(path.join(this.dataPath, 'memory.json'), this.memoryData, { spaces: 2 });
        }
        catch (error) {
            console.error('Failed to save memory:', error);
        }
    }
    async load() {
        try {
            const filePath = path.join(this.dataPath, 'memory.json');
            if (await fs.pathExists(filePath)) {
                this.memoryData = { ...this.initMemoryData(), ...await fs.readJson(filePath) };
            }
        }
        catch (error) {
            console.error('Failed to load memory:', error);
        }
    }
}
exports.MemorySystem = MemorySystem;
