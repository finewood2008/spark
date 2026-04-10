"use strict";
/**
 * MemorySystem - 记忆与自我进化系统
 *
 * 学习用户偏好，积累品牌知识，实现越用越懂你
 * 支持与 Hermes Agent 的底层 memory 工具交互理念
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
    async recordInteraction(record) {
        const interaction = { ...record, id: (0, uuid_1.v4)(), timestamp: new Date().toISOString() };
        this.memoryData.interactionHistory.push(interaction);
        if (this.memoryData.interactionHistory.length > 1000)
            this.memoryData.interactionHistory = this.memoryData.interactionHistory.slice(-1000);
        await this.save();
    }
    /**
     * 记录反馈，触发自我进化机制
     */
    async recordFeedback(contentId, action, feedback, diffSummary) {
        const record = {
            id: (0, uuid_1.v4)(), contentId, action, feedback, diffSummary, createdAt: new Date().toISOString(),
        };
        this.memoryData.preferences.feedbackHistory.push(record);
        if (this.memoryData.preferences.feedbackHistory.length > 500)
            this.memoryData.preferences.feedbackHistory = this.memoryData.preferences.feedbackHistory.slice(-500);
        this.memoryData.preferences.updatedAt = new Date().toISOString();
        await this.save();
        // 触发自我进化：提取规则
        if (feedback || diffSummary) {
            await this.adjustPreferences(action, feedback, diffSummary);
        }
    }
    /**
     * 自我进化核心逻辑：根据用户反馈调整全局 Prompt 注入库
     */
    async adjustPreferences(action, feedback, diffSummary) {
        // 简单提取逻辑，后续可接 LLM 意图提炼
        const prefs = this.memoryData.preferences;
        if (action === 'reject' && feedback) {
            // 用户明确拒绝，提取负向提示
            prefs.negativePrompts.push(feedback);
            if (prefs.negativePrompts.length > 20)
                prefs.negativePrompts.shift();
        }
        if (action === 'edit' && feedback) {
            // 用户修改了，可能是纠正 Tone，既有可能是正向，也有负向，这里先加入正向规则要求
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
    getEvolutionDirectives() {
        const prefs = this.memoryData.preferences;
        let directive = '';
        if (prefs.negativePrompts.length > 0) {
            directive += `\n【系统红线(禁忌)】:\n- ${prefs.negativePrompts.slice(-5).join('\n- ')}`;
        }
        if (prefs.positivePrompts.length > 0) {
            directive += `\n【成功经验(偏好)】:\n- ${prefs.positivePrompts.slice(-5).join('\n- ')}`;
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
