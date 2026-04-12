"use strict";
/**
 * SparkAgent - 火花 AI 大脑核心
 *
 * 重构说明：
 * 1. 移除了与营销无关的兜底回复，改为明确拦截。
 * 2. 注入 MemorySystem 中提炼的“自我进化”（Evolution Directives）规则到内容生成中。
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
exports.SparkAgent = void 0;
const events_1 = require("events");
const IntentParser_1 = require("./IntentParser");
const RAGEngine_1 = require("./RAGEngine");
const ContentGenerator_1 = require("./ContentGenerator");
const VIManager_1 = require("./VIManager");
const PublishingEngine_1 = require("./PublishingEngine");
const MemorySystem_1 = require("./MemorySystem");
const FileParser_1 = require("../tools/FileParser");
const HarnessLoader_1 = require("./HarnessLoader");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class SparkAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.currentBrandId = null;
        this.config = config;
        this.intentParser = new IntentParser_1.IntentParser(config.aiProvider);
        this.ragEngine = new RAGEngine_1.RAGEngine(config.dataPath);
        this.contentGenerator = new ContentGenerator_1.ContentGenerator(config.aiProvider);
        this.viManager = new VIManager_1.VIManager(config.aiProvider, config.dataPath);
        this.publishingEngine = new PublishingEngine_1.PublishingEngine();
        this.memorySystem = new MemorySystem_1.MemorySystem(config.dataPath);
        this.fileParser = new FileParser_1.FileParser();
        this.harnessLoader = new HarnessLoader_1.HarnessLoader();
    }
    async initBrand(brandId) {
        this.currentBrandId = brandId;
        await this.memorySystem.load();
        await this.ragEngine.initialize(brandId);
    }
    async processMessage(userId, message, context) {
        const intentResult = await this.intentParser.parse(message);
        switch (intentResult.intent) {
            case IntentParser_1.Intent.CREATE_CONTENT: return this.handleCreateContent(userId, intentResult);
            case IntentParser_1.Intent.BUILD_KNOWLEDGE: return this.handleBuildKnowledge(userId, intentResult);
            case IntentParser_1.Intent.MANAGE_VI: return this.handleManageVI(intentResult);
            case IntentParser_1.Intent.PUBLISH_CONTENT: return this.handlePublish(intentResult);
            case IntentParser_1.Intent.QUERY_KNOWLEDGE: return this.handleQueryKnowledge(intentResult);
            case IntentParser_1.Intent.REJECT_CHAT:
            default:
                return {
                    success: false,
                    type: 'reject',
                    message: intentResult.message || '抱歉，作为企业营销数字员工，我只能协助您处理品牌资产、内容创作和发布策略相关的任务。'
                };
        }
    }
    async handleCreateContent(userId, intent) {
        const topic = intent.params?.topic || '';
        const platform = intent.params?.platform || 'wechat';
        const style = intent.params?.style;
        // 自我进化：提取用户的隐含规则和要求
        const evolutionDirectives = await this.memorySystem.getEvolutionDirectives(topic);
        const explicitRequirements = intent.params?.requirements || '';
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
    async handleBuildKnowledge(userId, intent) {
        const source = intent.params?.source || 'user_input';
        const data = intent.params?.data;
        let parsedDocs = [];
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
    async handleManageVI(intent) {
        const action = intent.params?.action || 'get';
        if (action === 'generate') {
            const brandName = intent.params?.brandName || '我的品牌';
            const industry = intent.params?.industry || '通用';
            const result = await this.viManager.generateVI({ brandName, industry, colors: { primary: '#FF6B35' } });
            return { success: true, type: 'vi', data: result };
        }
        return { success: true, type: 'vi', data: null };
    }
    async handlePublish(intent) {
        const content = intent.params?.content;
        const platforms = intent.params?.platforms || ['wechat'];
        if (!content)
            return { success: false, type: 'publish', message: '缺少内容参数' };
        const result = await this.publishingEngine.publish({ id: `pub_${Date.now()}`, title: content.title, body: content.body, platform: content.platform || 'wechat' }, platforms);
        return { success: result.failed.length === 0, type: 'publish', data: result };
    }
    async handleQueryKnowledge(intent) {
        const query = intent.params?.query || '';
        const results = await this.ragEngine.search(query, 10, this.currentBrandId || undefined);
        return { success: true, type: 'query', data: { results } };
    }
    async recordFeedback(contentId, action, feedback, diffSummary) {
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
            }
            catch (e) {
                console.warn('[SparkAgent] Failed to write error log', e);
            }
        }
    }
    getBrandMemory() {
        if (!this.currentBrandId)
            return null;
        return this.memorySystem.getBrandMemory(this.currentBrandId);
    }
    destroy() {
        this.removeAllListeners();
    }
}
exports.SparkAgent = SparkAgent;
