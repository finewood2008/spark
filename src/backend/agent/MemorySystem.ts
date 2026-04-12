/**
 * MemorySystem - 记忆与自我进化系统
 * 
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 SDK memory 模块同步到云端
 *   2. 本地模式（fallback）— 文件存储
 * 
 * 学习用户偏好，积累品牌知识，实现越用越懂你
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QeeClawBridge } from '../qeeclaw/qeeclaw-client';

export interface UserPreference {
  writingStyle: string[];
  platforms: string[];
  contentTypes: string[];
  brandVoices: string[];
  colorPreferences: string[];
  excludedTopics: string[];
  negativePrompts: string[];
  positivePrompts: string[];
  feedbackHistory: FeedbackRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRecord {
  id: string;
  contentId: string;
  action: 'accept' | 'edit' | 'reject';
  feedback?: string;
  diffSummary?: string;
  createdAt: string;
}

export interface BrandMemory {
  id: string;
  name: string;
  industry: string;
  description: string;
  targetAudience: string;
  keyMessages: string[];
  competitorInfo: string[];
  brandStory: string;
  values: string[];
  voice: string;
  style: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoryData {
  preferences: UserPreference;
  brandMemories: Record<string, BrandMemory>;
  interactionHistory: InteractionRecord[];
}

export interface InteractionRecord {
  id: string;
  type: 'query' | 'generate' | 'publish' | 'feedback';
  intent: string;
  result?: string;
  feedback?: string;
  timestamp: string;
}

export class MemorySystem {
  private dataPath: string;
  private memoryData: MemoryData;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.memoryData = this.initMemoryData();
  }

  private initMemoryData(): MemoryData {
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

  private getBridge(): QeeClawBridge | null {
    try {
      const bridge = QeeClawBridge.get();
      return bridge.online ? bridge : null;
    } catch {
      return null;
    }
  }

  /** 将本地记忆条目同步到平台 */
  private async syncToPlatform(content: string, category: 'preference' | 'fact' | 'decision' | 'entity' | 'other' = 'preference', importance: number = 5): Promise<void> {
    const bridge = this.getBridge();
    if (!bridge) return;
    try {
      await bridge.storeMemory(content, category, importance);
    } catch (e) {
      console.warn('[MemorySystem] 平台同步失败，仅保留本地:', e);
    }
  }

  /** 从平台搜索记忆 */
  async searchPlatformMemory(query: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    const bridge = this.getBridge();
    if (!bridge) return [];
    try {
      return await bridge.searchMemory(query, limit);
    } catch {
      return [];
    }
  }

  // ─── 核心方法（保持原有接口不变） ─────────────

  async recordInteraction(record: Omit<InteractionRecord, 'id' | 'timestamp'>): Promise<void> {
    const interaction: InteractionRecord = { ...record, id: uuidv4(), timestamp: new Date().toISOString() };
    this.memoryData.interactionHistory.push(interaction);
    if (this.memoryData.interactionHistory.length > 1000) this.memoryData.interactionHistory = this.memoryData.interactionHistory.slice(-1000);
    await this.save();

    // 异步同步到平台（不阻塞）
    this.syncToPlatform(`[interaction] ${record.type}: ${record.intent}`, 'fact', 3).catch(() => {});
  }

  async recordFeedback(contentId: string, action: 'accept' | 'edit' | 'reject', feedback?: string, diffSummary?: string): Promise<void> {
    const record: FeedbackRecord = {
      id: uuidv4(), contentId, action, feedback, diffSummary, createdAt: new Date().toISOString(),
    };
    this.memoryData.preferences.feedbackHistory.push(record);
    if (this.memoryData.preferences.feedbackHistory.length > 500) this.memoryData.preferences.feedbackHistory = this.memoryData.preferences.feedbackHistory.slice(-500);

    this.memoryData.preferences.updatedAt = new Date().toISOString();
    await this.save();

    if (feedback || diffSummary) {
      await this.adjustPreferences(action, feedback, diffSummary);
    }

    // 同步反馈到平台
    const syncContent = `[feedback:${action}] ${feedback || diffSummary || contentId}`;
    const category = action === 'reject' ? 'decision' as const : 'preference' as const;
    this.syncToPlatform(syncContent, category, action === 'reject' ? 8 : 5).catch(() => {});
  }

  private async adjustPreferences(action: 'accept' | 'edit' | 'reject', feedback?: string, diffSummary?: string): Promise<void> {
    const prefs = this.memoryData.preferences;

    if (action === 'reject' && feedback) {
      prefs.negativePrompts.push(feedback);
      if (prefs.negativePrompts.length > 20) prefs.negativePrompts.shift();
    }

    if (action === 'edit' && feedback) {
      prefs.positivePrompts.push(`用户更正: ${feedback}`);
      if (prefs.positivePrompts.length > 20) prefs.positivePrompts.shift();
    }

    if (action === 'accept' && feedback) {
      prefs.positivePrompts.push(`成功经验: ${feedback}`);
      if (prefs.positivePrompts.length > 20) prefs.positivePrompts.shift();
    }

    await this.save();
  }

  /**
   * 获取进化指令：合并本地偏好 + 平台记忆
   * 调用方如果在非 async 上下文可继续用同步签名（返回 Promise 也可 await）
   */
  async getEvolutionDirectives(query?: string): Promise<string> {
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
          const content = (m as Record<string, unknown>).content || JSON.stringify(m);
          return `- ${content}`;
        }).join('\n');
        directive += `\n【平台记忆】:\n${items}`;
      }
    } catch {
      // 平台不可用，仅使用本地偏好
    }

    return directive;
  }

  getPreferences(): UserPreference { return this.memoryData.preferences; }

  async updatePreferences(updates: Partial<UserPreference>): Promise<void> {
    this.memoryData.preferences = { ...this.memoryData.preferences, ...updates, updatedAt: new Date().toISOString() };
    await this.save();
  }

  async createBrandMemory(brand: Omit<BrandMemory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandMemory> {
    const brandMemory: BrandMemory = { ...brand, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.memoryData.brandMemories[brandMemory.id] = brandMemory;
    await this.save();

    // 品牌信息同步到平台（高重要性）
    this.syncToPlatform(
      `[brand] ${brand.name} | ${brand.industry} | voice: ${brand.voice}`,
      'entity', 9
    ).catch(() => {});

    return brandMemory;
  }

  getBrandMemory(brandId: string): BrandMemory | null { return this.memoryData.brandMemories[brandId] || null; }

  async updateBrandMemory(brandId: string, updates: Partial<BrandMemory>): Promise<BrandMemory | null> {
    const existing = this.memoryData.brandMemories[brandId];
    if (!existing) return null;
    this.memoryData.brandMemories[brandId] = { ...existing, ...updates, id: brandId, updatedAt: new Date().toISOString() };
    await this.save();
    return this.memoryData.brandMemories[brandId];
  }

  async deleteBrandMemory(brandId: string): Promise<boolean> {
    if (this.memoryData.brandMemories[brandId]) { delete this.memoryData.brandMemories[brandId]; await this.save(); return true; }
    return false;
  }

  getAllBrandMemories(): BrandMemory[] { return Object.values(this.memoryData.brandMemories); }
  getInteractionHistory(limit: number = 100): InteractionRecord[] { return this.memoryData.interactionHistory.slice(-limit); }

  private async save(): Promise<void> {
    try {
      await fs.ensureDir(this.dataPath);
      await fs.writeJson(path.join(this.dataPath, 'memory.json'), this.memoryData, { spaces: 2 });
    } catch (error) { console.error('Failed to save memory:', error); }
  }

  async load(): Promise<void> {
    try {
      const filePath = path.join(this.dataPath, 'memory.json');
      if (await fs.pathExists(filePath)) {
        this.memoryData = { ...this.initMemoryData(), ...await fs.readJson(filePath) };
      }
    } catch (error) { console.error('Failed to load memory:', error); }
  }
}
