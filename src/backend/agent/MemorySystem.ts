/**
 * MemorySystem - 记忆与自我进化系统
 * 
 * 学习用户偏好，积累品牌知识，实现越用越懂你
 * 支持与 Hermes Agent 的底层 memory 工具交互理念
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UserPreference {
  writingStyle: string[];      // 喜欢的写作风格
  platforms: string[];         // 常用平台
  contentTypes: string[];      // 常创作的内容类型
  brandVoices: string[];       // 偏好的品牌调性
  colorPreferences: string[];  // 喜欢的配色
  excludedTopics: string[];    // 不喜欢的话题
  negativePrompts: string[];   // 进化的负向提示（用户明确表示不要的东西）
  positivePrompts: string[];   // 进化的正向提示（用户明确表扬或反复修改使用的东西）
  feedbackHistory: FeedbackRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRecord {
  id: string;
  contentId: string;
  action: 'accept' | 'edit' | 'reject';
  feedback?: string;  // 用户的显性反馈文本，如 "不要太轻浮"，"专业点"
  diffSummary?: string; // 用户编辑前后的差异摘要
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

  async recordInteraction(record: Omit<InteractionRecord, 'id' | 'timestamp'>): Promise<void> {
    const interaction: InteractionRecord = { ...record, id: uuidv4(), timestamp: new Date().toISOString() };
    this.memoryData.interactionHistory.push(interaction);
    if (this.memoryData.interactionHistory.length > 1000) this.memoryData.interactionHistory = this.memoryData.interactionHistory.slice(-1000);
    await this.save();
  }

  /**
   * 记录反馈，触发自我进化机制
   */
  async recordFeedback(contentId: string, action: 'accept' | 'edit' | 'reject', feedback?: string, diffSummary?: string): Promise<void> {
    const record: FeedbackRecord = {
      id: uuidv4(), contentId, action, feedback, diffSummary, createdAt: new Date().toISOString(),
    };
    this.memoryData.preferences.feedbackHistory.push(record);
    if (this.memoryData.preferences.feedbackHistory.length > 500) this.memoryData.preferences.feedbackHistory = this.memoryData.preferences.feedbackHistory.slice(-500);
    
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
  private async adjustPreferences(action: 'accept' | 'edit' | 'reject', feedback?: string, diffSummary?: string): Promise<void> {
    // 简单提取逻辑，后续可接 LLM 意图提炼
    const prefs = this.memoryData.preferences;
    
    if (action === 'reject' && feedback) {
      // 用户明确拒绝，提取负向提示
      prefs.negativePrompts.push(feedback);
      if (prefs.negativePrompts.length > 20) prefs.negativePrompts.shift();
    }
    
    if (action === 'edit' && feedback) {
       // 用户修改了，可能是纠正 Tone，既有可能是正向，也有负向，这里先加入正向规则要求
       prefs.positivePrompts.push(`用户更正: ${feedback}`);
       if (prefs.positivePrompts.length > 20) prefs.positivePrompts.shift();
    }

    if (action === 'accept' && feedback) {
        prefs.positivePrompts.push(`成功经验: ${feedback}`);
        if (prefs.positivePrompts.length > 20) prefs.positivePrompts.shift();
    }

    await this.save();
  }

  getEvolutionDirectives(): string {
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

  getPreferences(): UserPreference { return this.memoryData.preferences; }

  async updatePreferences(updates: Partial<UserPreference>): Promise<void> {
    this.memoryData.preferences = { ...this.memoryData.preferences, ...updates, updatedAt: new Date().toISOString() };
    await this.save();
  }

  async createBrandMemory(brand: Omit<BrandMemory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandMemory> {
    const brandMemory: BrandMemory = { ...brand, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.memoryData.brandMemories[brandMemory.id] = brandMemory;
    await this.save();
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