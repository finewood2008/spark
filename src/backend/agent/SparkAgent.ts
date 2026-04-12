/**
 * SparkAgent - 火花 AI 大脑核心
 * 
 * 重构说明：
 * 1. 移除了与营销无关的兜底回复，改为明确拦截。
 * 2. 注入 MemorySystem 中提炼的“自我进化”（Evolution Directives）规则到内容生成中。
 */

import { EventEmitter } from 'events';
import { IntentParser, Intent, IntentResult } from './IntentParser';
import { RAGEngine, SearchResult } from './RAGEngine';
import { ContentGenerator, GenerateOptions, GeneratedContent, Platform } from './ContentGenerator';
import { VIManager, VIResult } from './VIManager';
import { PublishingEngine, PublishResult } from './PublishingEngine';
import { MemorySystem, UserPreference, BrandMemory } from './MemorySystem';
import { AIProvider } from '../tools/AIProvider';
import { FileParser, ParsedDocument } from '../tools/FileParser';
import { HarnessLoader } from './HarnessLoader';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface SparkAgentConfig {
  dataPath: string;
  aiProvider: AIProvider;
}

export interface AgentResponse {
  success: boolean;
  type: string;
  data?: unknown;
  message?: string;
}

export class SparkAgent extends EventEmitter {
  private config: SparkAgentConfig;
  private intentParser: IntentParser;
  private ragEngine: RAGEngine;
  private contentGenerator: ContentGenerator;
  private viManager: VIManager;
  private publishingEngine: PublishingEngine;
  private memorySystem: MemorySystem;
  private fileParser: FileParser;
  private harnessLoader: HarnessLoader;
  
  private currentBrandId: string | null = null;

  constructor(config: SparkAgentConfig) {
    super();
    this.config = config;
    this.intentParser = new IntentParser(config.aiProvider);
    this.ragEngine = new RAGEngine(config.dataPath);
    this.contentGenerator = new ContentGenerator(config.aiProvider);
    this.viManager = new VIManager(config.aiProvider, config.dataPath);
    this.publishingEngine = new PublishingEngine();
    this.memorySystem = new MemorySystem(config.dataPath);
    this.fileParser = new FileParser();
    this.harnessLoader = new HarnessLoader();
  }

  async initBrand(brandId: string): Promise<void> {
    this.currentBrandId = brandId;
    await this.memorySystem.load();
    await this.ragEngine.initialize(brandId);
  }

  async processMessage(userId: string, message: string, context?: Record<string, unknown>): Promise<AgentResponse> {
    const intentResult = await this.intentParser.parse(message);
    
    switch (intentResult.intent) {
      case Intent.CREATE_CONTENT: return this.handleCreateContent(userId, intentResult);
      case Intent.BUILD_KNOWLEDGE: return this.handleBuildKnowledge(userId, intentResult);
      case Intent.MANAGE_VI: return this.handleManageVI(intentResult);
      case Intent.PUBLISH_CONTENT: return this.handlePublish(intentResult);
      case Intent.QUERY_KNOWLEDGE: return this.handleQueryKnowledge(intentResult);
      case Intent.REJECT_CHAT:
      default:
        return {
          success: false,
          type: 'reject',
          message: intentResult.message || '抱歉，作为企业营销数字员工，我只能协助您处理品牌资产、内容创作和发布策略相关的任务。'
        };
    }
  }

  private async handleCreateContent(userId: string, intent: IntentResult): Promise<AgentResponse> {
    const topic = (intent.params?.topic as string) || '';
    const platform = (intent.params?.platform as Platform) || 'wechat';
    const style = intent.params?.style as string | undefined;
    
    // 自我进化：提取用户的隐含规则和要求
    const evolutionDirectives = await this.memorySystem.getEvolutionDirectives(topic);
    const explicitRequirements = (intent.params?.requirements as string) || '';
    
    // 加载 Harness 规范（工作流、标准、自检清单）
    const harnessContext = await this.harnessLoader.getHarnessContext(intent.intent, platform);
    
    // 将历史进化规则、Harness 规范和当前请求合并
    const combinedRequirements = `${explicitRequirements}\n\n【Spark 记忆注入（根据您的历史偏好自动应用）】:${evolutionDirectives}\n${harnessContext}`.trim();
    
    const brandMemory = this.currentBrandId ? this.memorySystem.getBrandMemory(this.currentBrandId) : null;
    const searchResults = await this.ragEngine.search(topic, 5, this.currentBrandId || undefined);
    
    const generated = await this.contentGenerator.generate({
      topic,
      platform,
      style,
      requirements: combinedRequirements,
      brandMemory: brandMemory || undefined,
      searchResults,
    });
    
    await this.memorySystem.recordInteraction({ type: 'generate', intent: `生成${platform}内容: ${topic}`, result: generated.id });
    return { success: true, type: 'content', data: generated };
  }

  private async handleBuildKnowledge(userId: string, intent: IntentResult): Promise<AgentResponse> {
    const source = (intent.params?.source as string) || 'user_input';
    const data = intent.params?.data;
    let parsedDocs: ParsedDocument[] = [];
    
    if (typeof data === 'string') {
      parsedDocs = await this.fileParser.parse(source, data);
    }
    
    for (const doc of parsedDocs) {
      await this.ragEngine.addDocument({
        id: doc.id, content: doc.content,
        metadata: { brandId: this.currentBrandId || 'default', category: 'company', createdAt: new Date().toISOString() },
      });
    }
    
    return { success: true, type: 'knowledge', data: { added: parsedDocs.length }, message: `成功添加 ${parsedDocs.length} 个文档到知识库` };
  }

  private async handleManageVI(intent: IntentResult): Promise<AgentResponse> {
    const action = (intent.params?.action as string) || 'get';
    if (action === 'generate') {
      const brandName = (intent.params?.brandName as string) || '我的品牌';
      const industry = (intent.params?.industry as string) || '通用';
      const result = await this.viManager.generateVI({ brandName, industry, colors: { primary: '#FF6B35' } });
      return { success: true, type: 'vi', data: result };
    }
    return { success: true, type: 'vi', data: null };
  }

  private async handlePublish(intent: IntentResult): Promise<AgentResponse> {
    const content = intent.params?.content as { title: string; body: string; platform?: Platform; } | undefined;
    const platforms = (intent.params?.platforms as Platform[]) || ['wechat'];
    if (!content) return { success: false, type: 'publish', message: '缺少内容参数' };
    
    const result = await this.publishingEngine.publish(
      { id: `pub_${Date.now()}`, title: content.title, body: content.body, platform: content.platform || 'wechat' },
      platforms
    );
    return { success: result.failed.length === 0, type: 'publish', data: result };
  }

  private async handleQueryKnowledge(intent: IntentResult): Promise<AgentResponse> {
    const query = (intent.params?.query as string) || '';
    const results = await this.ragEngine.search(query, 10, this.currentBrandId || undefined);
    return { success: true, type: 'query', data: { results } };
  }

  async recordFeedback(contentId: string, action: 'accept' | 'edit' | 'reject', feedback?: string, diffSummary?: string): Promise<void> {
    // 将差异摘要和反馈结合传递给记忆系统，触发进化
    await this.memorySystem.recordFeedback(contentId, action, feedback, diffSummary);

    // 如果反馈是明确指出错误（例如修改了格式、违背了规范），可以写入 errors/log.md
    if (action === 'reject' || (action === 'edit' && feedback?.includes('错误'))) {
      const errorLogPath = path.join(this.config.dataPath, '../../harness/errors/log.md');
      try {
        if (await fs.pathExists(errorLogPath)) {
          const date = new Date().toISOString().split('T')[0];
          const logEntry = `\n### ${date} - 用户纠正/拒绝生成结果\n- **触发场景**: 生成内容 (ID: ${contentId})\n- **错误表现**: ${feedback || '用户主动拒绝/修改了内容'}\n- **根本原因**: 生成结果未能满足隐含预期或违背了规范\n- **防范措施**: 已通过 MemorySystem 自动吸收为负向提示词。\n`;
          const currentLog = await fs.readFile(errorLogPath, 'utf-8');
          // 插入到 "## 日志记录\n\n*(新记录添加在最上面)*\n" 之后
          const insertMarker = '*(新记录添加在最上面)*\n';
          const insertIndex = currentLog.indexOf(insertMarker);
          if (insertIndex !== -1) {
             const newLog = currentLog.slice(0, insertIndex + insertMarker.length) + logEntry + currentLog.slice(insertIndex + insertMarker.length);
             await fs.writeFile(errorLogPath, newLog, 'utf-8');
          }
        }
      } catch (e) {
        console.warn('[SparkAgent] Failed to write error log', e);
      }
    }
  }

  getBrandMemory(): BrandMemory | null {
    if (!this.currentBrandId) return null;
    return this.memorySystem.getBrandMemory(this.currentBrandId);
  }

  destroy(): void {
    this.removeAllListeners();
  }
}