"use strict";
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
exports.setupRealAgentIPC = setupRealAgentIPC;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const openai_1 = require("openai");
const qeeclaw_client_1 = require("../backend/qeeclaw/qeeclaw-client");
const RAGEngine_1 = require("../backend/agent/RAGEngine");
// ─── RAG Engine lazy singleton ──────────────────
let _ragEngine = null;
function getRAGEngine() {
    if (!_ragEngine) {
        _ragEngine = new RAGEngine_1.RAGEngine(electron_1.app.getPath('userData'));
    }
    return _ragEngine;
}
// ─── 本地记忆文件（轻量 fallback） ──────────────
const MEMORY_PATH = path.join(electron_1.app.getPath('userData'), 'agent_memory.json');
function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_PATH)) {
            return fs.readJsonSync(MEMORY_PATH);
        }
    }
    catch (e) {
        console.error("Failed to load memory:", e);
    }
    return [];
}
function saveMemory(knowledge) {
    const mem = loadMemory();
    mem.push(knowledge);
    fs.writeJsonSync(MEMORY_PATH, mem);
}
// 模拟读取项目的 harness 规范
function getHarnessContext() {
    try {
        const workspaceDir = path.join(process.cwd(), 'harness');
        let context = "";
        const standardsPath = path.join(workspaceDir, 'standards', 'brand_voice.md');
        if (fs.existsSync(standardsPath)) {
            context += `\n[品牌文案规范]\n${fs.readFileSync(standardsPath, 'utf8')}\n`;
        }
        const uiPath = path.join(workspaceDir, 'workflows', 'design_ui.md');
        if (fs.existsSync(uiPath)) {
            context += `\n[设计规范]\n${fs.readFileSync(uiPath, 'utf8')}\n`;
        }
        const selfCheckPath = path.join(workspaceDir, 'self-check.md');
        if (fs.existsSync(selfCheckPath)) {
            context += `\n[自检清单]\n${fs.readFileSync(selfCheckPath, 'utf8')}\n`;
        }
        return context;
    }
    catch (e) {
        return "";
    }
}
// ─── QeeClaw 平台初始化 ─────────────────────────
async function initQeeClawBridge() {
    const baseUrl = process.env.QEECLAW_BASE_URL || 'https://api.qeeclaw.com';
    const token = process.env.QEECLAW_TOKEN || '';
    const teamId = parseInt(process.env.QEECLAW_TEAM_ID || '0', 10);
    if (!token || !teamId) {
        console.log('[agent-ipc] QeeClaw 未配置 (QEECLAW_TOKEN / QEECLAW_TEAM_ID)，使用纯本地模式');
        return false;
    }
    try {
        const config = { baseUrl, token, teamId };
        const bridge = await qeeclaw_client_1.QeeClawBridge.init(config);
        const online = await bridge.ping();
        console.log(`[agent-ipc] QeeClaw 平台 ${online ? '已连接' : '不可达，降级本地模式'}`);
        return online;
    }
    catch (e) {
        console.warn('[agent-ipc] QeeClaw 初始化失败:', e);
        return false;
    }
}
// ─── 主入口 ──────────────────────────────────────
function setupRealAgentIPC() {
    // 异步初始化平台（不阻塞 IPC 注册）
    initQeeClawBridge().catch(() => { });
    // Gemini Proxy fallback — used when QeeClaw platform is unreachable.
    const openai = new openai_1.OpenAI({
        apiKey: 'gemini-proxy-no-key-needed',
        baseURL: 'https://gemini-proxy.finewood2008.workers.dev/v1',
    });
    let conversationHistory = [];
    electron_1.ipcMain.removeHandler('agent:chat');
    electron_1.ipcMain.handle('agent:chat', async (_, message) => {
        try {
            console.log(`[IPC] Sending message to LLM API: ${message}`);
            // 进化机制：关键词触发记忆存储
            if (message.includes("记住") || message.includes("下次") || message.includes("以后")) {
                saveMemory(message);
                // 同步到平台记忆
                try {
                    const bridge = qeeclaw_client_1.QeeClawBridge.get();
                    if (bridge.online) {
                        await bridge.storeMemory(message, 'preference', 8);
                    }
                }
                catch { /* 平台不可用 */ }
                return {
                    success: true,
                    type: 'text',
                    message: '好的！我已经把这个偏好存入我的永久记忆库了，以后生成内容时我都会遵守这个规则。'
                };
            }
            // ─── 组装超级提示词 ─────────────────
            const memoryList = loadMemory();
            // 尝试从平台拉取相关记忆
            let platformMemoryContext = '';
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const platformMems = await bridge.searchMemory(message, 5);
                    if (platformMems.length > 0) {
                        const items = platformMems.map(m => `- ${m.content || JSON.stringify(m)}`).join('\n');
                        platformMemoryContext = `\n\n【平台记忆检索结果】\n${items}`;
                    }
                }
            }
            catch { /* 平台不可用 */ }
            const memoryContext = memoryList.length > 0
                ? `\n\n【用户个人的偏好与记忆（最高优先级规则）】\n${memoryList.map(m => `- ${m}`).join('\n')}`
                : '';
            const harnessContext = getHarnessContext();
            const systemPrompt = `你叫 Alex，是 Spark 火花应用里的 CMO 数字营销专家。
你非常专业，负责帮中小企业生成营销文案和设计。
不要说多余的废话。

如果你认为用户的请求是希望你写一篇文案（如小红书、推特、公众号），你必须返回一段符合以下 JSON 格式的数据，不要包裹任何 markdown 标记，直接返回 JSON 对象：
{
  "type": "content",
  "data": {
    "title": "文案标题",
    "body": "文案正文",
    "hashtags": ["标签1", "标签2"],
    "platform": "xiaohongshu" 
  }
}

如果你认为只是普通对话或需要继续澄清需求，请直接回复纯文本。

【系统基础规范与工作流加载区】${harnessContext}
${memoryContext}${platformMemoryContext}`;
            if (conversationHistory.length === 0) {
                conversationHistory.push({ role: 'system', content: systemPrompt });
            }
            conversationHistory.push({ role: 'user', content: message });
            // 尝试通过平台模型路由调用
            let reply = '';
            let usedPlatform = false;
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const prompt = conversationHistory.map(m => {
                        if (m.role === 'system')
                            return `[System] ${m.content}`;
                        if (m.role === 'user')
                            return `[User] ${m.content}`;
                        return `[Assistant] ${m.content}`;
                    }).join('\n\n');
                    const result = await bridge.invokeModel(prompt);
                    reply = result.text;
                    usedPlatform = true;
                }
            }
            catch {
                // 平台调用失败，走 Gemini Proxy 直连
            }
            if (!usedPlatform) {
                const completion = await openai.chat.completions.create({
                    messages: conversationHistory,
                    model: 'gemini-2.0-flash',
                    temperature: 0.7,
                });
                reply = completion.choices[0].message.content || '';
            }
            conversationHistory.push({ role: 'assistant', content: reply });
            // 尝试解析 JSON 卡片
            try {
                if (reply.trim().startsWith('{') && reply.trim().endsWith('}')) {
                    const parsed = JSON.parse(reply.trim());
                    if (parsed.type === 'content') {
                        return {
                            success: true,
                            type: 'content',
                            data: parsed.data,
                            message: '我已经为你准备好了第一版文案草稿。你看一下这种语气合适吗？如果有需要修改的地方直接告诉我，我下次就会记住。'
                        };
                    }
                }
            }
            catch (e) {
                // 普通文本
            }
            return {
                success: true,
                type: 'text',
                message: reply
            };
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[Agent IPC Error]', error);
            return {
                success: false,
                type: 'text',
                message: `处理请求时发生错误: ${errMsg}`
            };
        }
    });
    // ─── content:generate — 图文内容生成（SDK 优先） ─────────────
    electron_1.ipcMain.removeHandler('content:generate');
    electron_1.ipcMain.handle('content:generate', async (_, params) => {
        try {
            const { topic, platforms, style, brandContext } = params;
            const harnessContext = getHarnessContext();
            const memoryList = loadMemory();
            const memoryContext = memoryList.length > 0
                ? `\n\n【用户偏好记忆】\n${memoryList.map(m => `- ${m}`).join('\n')}`
                : '';
            const systemPrompt = `你是火花 Spark 的内容创作引擎。根据用户给出的主题，生成一篇完整的图文内容。

要求：
- 目标平台：${platforms.join('、')}
- 写作风格：${style}
- 内容结构：标题 + 3-5个内容段落，每2段之间插入一个配图描述
- 配图描述要具体，描述画面内容、色调、构图，方便后续AI绘图

你必须严格返回以下JSON格式（不要包裹markdown标记）：
{
  "title": "文章标题",
  "coverPrompt": "封面图的AI绘图提示词，要具体描述画面",
  "blocks": [
    { "type": "text", "content": "段落文字内容" },
    { "type": "image", "imagePrompt": "配图的AI绘图提示词" },
    { "type": "text", "content": "段落文字内容" }
  ]
}
${brandContext ? `\n【品牌上下文】\n${brandContext}` : ''}
${harnessContext}${memoryContext}`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `请围绕以下主题生成图文内容：${topic}` },
            ];
            // SDK 优先 → openai 直连 fallback
            let reply = '';
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const chunks = [];
                    for await (const chunk of bridge.models.invokeStream({ messages, temperature: 0.8 })) {
                        chunks.push(chunk);
                    }
                    reply = chunks.join('');
                }
            }
            catch {
                // SDK 不可用，走 fallback
            }
            if (!reply) {
                const completion = await openai.chat.completions.create({
                    messages,
                    model: 'gemini-2.0-flash',
                    temperature: 0.8,
                });
                reply = completion.choices[0].message.content || '';
            }
            // 尝试解析JSON
            try {
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return { success: true, data: parsed };
                }
            }
            catch { }
            // 解析失败则返回原始文本作为单段落
            return {
                success: true,
                data: {
                    title: `${topic.slice(0, 30)}`,
                    coverPrompt: `${topic} 主题封面，现代简约风格`,
                    blocks: [{ type: 'text', content: reply }],
                },
            };
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[content:generate Error]', error);
            return { success: false, error: errMsg };
        }
    });
    // ─── video:generate — 视频分镜脚本生成（SDK 优先） ────────────
    electron_1.ipcMain.removeHandler('video:generate');
    electron_1.ipcMain.handle('video:generate', async (_, params) => {
        try {
            const { topic, platforms, style, ratio, bgm } = params;
            const systemPrompt = `你是火花 Spark 的短视频导演AI。根据用户主题生成一份完整的分镜脚本。

要求：
- 目标平台：${platforms.join('、')}
- 视频风格：${style}
- 画面比例：${ratio}
- BGM风格：${bgm}
- 生成5-7个分镜，每个分镜包含口播文案和画面描述
- 第一个分镜必须是3秒钩子（吸引注意力）
- 最后一个分镜是总结+引导关注

你必须严格返回以下JSON格式（不要包裹markdown标记）：
{
  "title": "视频标题",
  "hook": "前3秒钩子文案",
  "scenes": [
    {
      "duration": 3,
      "narration": "口播/旁白文案",
      "visualDesc": "画面描述（给AI绘图或拍摄指导）",
      "transition": "fade"
    }
  ]
}

transition可选值：cut, fade, dissolve, slide_left, slide_right, zoom_in, zoom_out, wipe`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `请为以下主题生成短视频分镜脚本：${topic}` },
            ];
            // SDK 优先 → openai 直连 fallback
            let reply = '';
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const chunks = [];
                    for await (const chunk of bridge.models.invokeStream({ messages, temperature: 0.8 })) {
                        chunks.push(chunk);
                    }
                    reply = chunks.join('');
                }
            }
            catch {
                // SDK 不可用，走 fallback
            }
            if (!reply) {
                const completion = await openai.chat.completions.create({
                    messages,
                    model: 'gemini-2.0-flash',
                    temperature: 0.8,
                });
                reply = completion.choices[0].message.content || '';
            }
            try {
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return { success: true, data: parsed };
                }
            }
            catch { }
            return { success: false, error: '无法解析AI返回的分镜脚本' };
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[video:generate Error]', error);
            return { success: false, error: errMsg };
        }
    });
    // ─── workspace:generate — AI工作台内容生成（SDK 优先） ────────
    electron_1.ipcMain.removeHandler('workspace:generate');
    electron_1.ipcMain.handle('workspace:generate', async (_, params) => {
        try {
            const { prompt, type } = params;
            const systemPrompt = `你是火花 Spark 的品牌设计AI。用户会给你一个创作指令，请生成对应的内容。

当前任务类型：${type}

根据任务类型返回不同格式：
- 如果是文案类（slogan、文案、标题），返回3-4个不同版本的文案方案
- 如果是视觉类（海报、Logo、名片），返回3-4个设计方案的详细描述

你必须严格返回以下JSON格式（不要包裹markdown标记）：
{
  "results": [
    {
      "title": "方案名称",
      "content": "方案内容或设计描述",
      "tags": ["标签1", "标签2"]
    }
  ]
}`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ];
            // SDK 优先 → openai 直连 fallback
            let reply = '';
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const chunks = [];
                    for await (const chunk of bridge.models.invokeStream({ messages, temperature: 0.9 })) {
                        chunks.push(chunk);
                    }
                    reply = chunks.join('');
                }
            }
            catch {
                // SDK 不可用，走 fallback
            }
            if (!reply) {
                const completion = await openai.chat.completions.create({
                    messages,
                    model: 'gemini-2.0-flash',
                    temperature: 0.9,
                });
                reply = completion.choices[0].message.content || '';
            }
            try {
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return { success: true, data: parsed };
                }
            }
            catch { }
            return {
                success: true,
                data: { results: [{ title: '方案 1', content: reply, tags: [] }] },
            };
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[workspace:generate Error]', error);
            return { success: false, error: errMsg };
        }
    });
    electron_1.ipcMain.removeHandler('agent:feedback');
    electron_1.ipcMain.handle('agent:feedback', async (_, contentId, action, text) => {
        if (action === 'reject' && text) {
            saveMemory(`对于生成的文案，用户曾反馈不满意：${text}`);
            // 同步到平台
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    await bridge.storeMemory(`[reject] ${text}`, 'decision', 8);
                }
            }
            catch { /* 平台不可用 */ }
        }
        return { success: true };
    });
    // ─── knowledge:list — 列出知识库文档 ────────────
    electron_1.ipcMain.removeHandler('knowledge:list');
    electron_1.ipcMain.handle('knowledge:list', async (_event, params) => {
        try {
            // Try platform SDK first
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const result = await bridge.knowledge.list({
                        teamId: bridge.teamId,
                        page: params.page || 1,
                        pageSize: params.pageSize || 50,
                    });
                    return { success: true, data: result };
                }
            }
            catch { }
            // Fallback: return local RAG documents
            const ragEngine = getRAGEngine();
            await ragEngine.initialize(params.brandId);
            const exportJson = await ragEngine.exportKnowledge(params.brandId);
            const allDocs = JSON.parse(exportJson || '[]');
            const docs = allDocs.map(d => ({
                id: d.id,
                name: d.metadata?.sourceName || d.metadata?.source || d.id,
                type: d.metadata?.category || 'document',
                chunks: 1,
                vectors: 1,
                status: 'embedded',
                uploadedAt: d.metadata?.createdAt || new Date().toISOString(),
                content: d.content.slice(0, 200),
            }));
            return { success: true, data: { items: docs, total: docs.length } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ─── knowledge:search — 语义搜索知识库 ──────────
    electron_1.ipcMain.removeHandler('knowledge:search');
    electron_1.ipcMain.handle('knowledge:search', async (_event, params) => {
        try {
            // Try platform SDK first
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const result = await bridge.knowledge.search({
                        teamId: bridge.teamId,
                        query: params.query,
                        limit: params.limit || 10,
                    });
                    return { success: true, data: result };
                }
            }
            catch { }
            // Fallback: RAGEngine local search
            const ragEngine = getRAGEngine();
            await ragEngine.initialize(params.brandId);
            const results = await ragEngine.search(params.query, params.limit || 10, params.brandId);
            return { success: true, data: { results } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ─── knowledge:ingest — 上传/导入文档 ───────────
    electron_1.ipcMain.removeHandler('knowledge:ingest');
    electron_1.ipcMain.handle('knowledge:ingest', async (_event, params) => {
        try {
            // Try platform SDK first
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const result = await bridge.knowledge.ingest({
                        teamId: bridge.teamId,
                        content: params.content,
                        sourceName: params.sourceName,
                    });
                    return { success: true, data: result };
                }
            }
            catch { }
            // Fallback: add to local RAG
            const ragEngine = getRAGEngine();
            await ragEngine.initialize(params.brandId);
            const category = (params.category || 'company');
            await ragEngine.addDocument({
                id: `doc_${Date.now()}`,
                content: params.content,
                metadata: {
                    brandId: params.brandId,
                    category,
                    source: params.sourceName,
                    createdAt: new Date().toISOString(),
                },
            });
            return { success: true, data: { message: 'Document ingested locally' } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ─── knowledge:delete — 删除文档 ────────────────
    electron_1.ipcMain.removeHandler('knowledge:delete');
    electron_1.ipcMain.handle('knowledge:delete', async (_event, params) => {
        try {
            // Try platform SDK first
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const result = await bridge.knowledge.delete({
                        teamId: bridge.teamId,
                        sourceName: params.sourceName || params.docId,
                    });
                    return { success: true, data: result };
                }
            }
            catch { }
            // Fallback: delete from local RAG
            const ragEngine = getRAGEngine();
            await ragEngine.initialize(params.brandId);
            await ragEngine.deleteDocument(params.docId);
            return { success: true, data: { message: 'Document deleted' } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ─── knowledge:stats — 知识库统计 ───────────────
    electron_1.ipcMain.removeHandler('knowledge:stats');
    electron_1.ipcMain.handle('knowledge:stats', async (_event, params) => {
        try {
            // Try platform SDK first
            try {
                const bridge = qeeclaw_client_1.QeeClawBridge.get();
                if (bridge.online) {
                    const result = await bridge.knowledge.stats({
                        teamId: bridge.teamId,
                    });
                    return { success: true, data: result };
                }
            }
            catch { }
            // Fallback: local RAG stats
            const ragEngine = getRAGEngine();
            await ragEngine.initialize(params.brandId);
            const stats = ragEngine.getStats(params.brandId);
            return { success: true, data: stats };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ═══════════════════════════════════════════════════════════════════
    //  以下为 QeeClaw 平台管理类模块 — 纯 SDK 调用，无本地 fallback
    // ═══════════════════════════════════════════════════════════════════
    // ─── billing ──────────────────────────────────────
    electron_1.ipcMain.removeHandler('billing:getWallet');
    electron_1.ipcMain.handle('billing:getWallet', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.billing.getWallet() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('billing:listRecords');
    electron_1.ipcMain.handle('billing:listRecords', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.billing.listRecords(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('billing:getSummary');
    electron_1.ipcMain.handle('billing:getSummary', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.billing.getSummary() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── iam ──────────────────────────────────────────
    electron_1.ipcMain.removeHandler('iam:getProfile');
    electron_1.ipcMain.handle('iam:getProfile', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.iam.getProfile() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('iam:updateProfile');
    electron_1.ipcMain.handle('iam:updateProfile', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            // SDK expects { fullName?, email?, phone? } — map nickname to fullName
            return { success: true, data: await bridge.iam.updateProfile({ fullName: payload.nickname }) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('iam:updatePreference');
    electron_1.ipcMain.handle('iam:updatePreference', async (_event, preferredModel) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.iam.updatePreference(preferredModel) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('iam:listUsers');
    electron_1.ipcMain.handle('iam:listUsers', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.iam.listUsers(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('iam:listProducts');
    electron_1.ipcMain.handle('iam:listProducts', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.iam.listProducts() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── apikey ───────────────────────────────────────
    electron_1.ipcMain.removeHandler('apikey:list');
    electron_1.ipcMain.handle('apikey:list', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.apikey.list(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:create');
    electron_1.ipcMain.handle('apikey:create', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.apikey.create() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:remove');
    electron_1.ipcMain.handle('apikey:remove', async (_event, appKeyId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            await bridge.apikey.remove(appKeyId);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:rename');
    electron_1.ipcMain.handle('apikey:rename', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            await bridge.apikey.rename(params.appKeyId, params.keyName);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:listLLMKeys');
    electron_1.ipcMain.handle('apikey:listLLMKeys', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.apikey.listLLMKeys() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:createLLMKey');
    electron_1.ipcMain.handle('apikey:createLLMKey', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.apikey.createLLMKey({ name: payload.providerName, description: payload.label }) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('apikey:removeLLMKey');
    electron_1.ipcMain.handle('apikey:removeLLMKey', async (_event, keyId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            await bridge.apikey.removeLLMKey(keyId);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── tenant ───────────────────────────────────────
    electron_1.ipcMain.removeHandler('tenant:getCurrentContext');
    electron_1.ipcMain.handle('tenant:getCurrentContext', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.tenant.getCurrentContext() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('tenant:getCompanyVerification');
    electron_1.ipcMain.handle('tenant:getCompanyVerification', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.tenant.getCompanyVerification() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── devices ──────────────────────────────────────
    electron_1.ipcMain.removeHandler('devices:list');
    electron_1.ipcMain.handle('devices:list', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.devices.list() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('devices:getOnlineState');
    electron_1.ipcMain.handle('devices:getOnlineState', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.devices.getOnlineState() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('devices:createPairCode');
    electron_1.ipcMain.handle('devices:createPairCode', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.devices.createPairCode() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('devices:claim');
    electron_1.ipcMain.handle('devices:claim', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.devices.claim({ code: payload.pairCode, deviceName: payload.deviceName ?? 'My Device' }) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('devices:remove');
    electron_1.ipcMain.handle('devices:remove', async (_event, deviceId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            await bridge.devices.remove(deviceId);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── channels ─────────────────────────────────────
    electron_1.ipcMain.removeHandler('channels:getOverview');
    electron_1.ipcMain.handle('channels:getOverview', async (_event, teamId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.channels.getOverview(teamId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('channels:list');
    electron_1.ipcMain.handle('channels:list', async (_event, teamId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.channels.list(teamId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('channels:listBindings');
    electron_1.ipcMain.handle('channels:listBindings', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.channels.listChannelBindings(params.teamId, params.channelKey) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── conversations ────────────────────────────────
    electron_1.ipcMain.removeHandler('conversations:getHome');
    electron_1.ipcMain.handle('conversations:getHome', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.conversations.getHome(params.teamId, params.groupLimit, params.historyLimit) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('conversations:getStats');
    electron_1.ipcMain.handle('conversations:getStats', async (_event, teamId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.conversations.getStats(teamId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('conversations:listGroups');
    electron_1.ipcMain.handle('conversations:listGroups', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.conversations.listGroups(params) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('conversations:listHistory');
    electron_1.ipcMain.handle('conversations:listHistory', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.conversations.listHistory(params) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('conversations:sendMessage');
    electron_1.ipcMain.handle('conversations:sendMessage', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.conversations.sendMessage(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── audit ────────────────────────────────────────
    electron_1.ipcMain.removeHandler('audit:record');
    electron_1.ipcMain.handle('audit:record', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            await bridge.audit.record(payload);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('audit:listEvents');
    electron_1.ipcMain.handle('audit:listEvents', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.audit.listEvents(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('audit:getSummary');
    electron_1.ipcMain.handle('audit:getSummary', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.audit.getSummary(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── policy ───────────────────────────────────────
    electron_1.ipcMain.removeHandler('policy:checkToolAccess');
    electron_1.ipcMain.handle('policy:checkToolAccess', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.policy.checkToolAccess(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('policy:checkExecAccess');
    electron_1.ipcMain.handle('policy:checkExecAccess', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.policy.checkExecAccess(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── approval ─────────────────────────────────────
    electron_1.ipcMain.removeHandler('approval:request');
    electron_1.ipcMain.handle('approval:request', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.approval.request(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('approval:list');
    electron_1.ipcMain.handle('approval:list', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.approval.list(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('approval:get');
    electron_1.ipcMain.handle('approval:get', async (_event, approvalId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.approval.get(approvalId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('approval:resolve');
    electron_1.ipcMain.handle('approval:resolve', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.approval.resolve(params.approvalId, { approved: params.decision === 'approved', comment: params.comment }) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── file ─────────────────────────────────────────
    electron_1.ipcMain.removeHandler('file:listDocuments');
    electron_1.ipcMain.handle('file:listDocuments', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.file.listDocuments(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('file:getDocument');
    electron_1.ipcMain.handle('file:getDocument', async (_event, documentId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.file.getDocument(documentId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── voice ────────────────────────────────────────
    electron_1.ipcMain.removeHandler('voice:transcribe');
    electron_1.ipcMain.handle('voice:transcribe', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            // SDK expects file: Blob|Uint8Array|ArrayBuffer — decode base64 to Uint8Array
            const buffer = Buffer.from(payload.audioBase64, 'base64');
            return { success: true, data: await bridge.voice.transcribe({ file: buffer, language: payload.language, filename: payload.filename ?? 'audio.webm', contentType: payload.format }) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('voice:synthesize');
    electron_1.ipcMain.handle('voice:synthesize', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.voice.synthesize(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('voice:speech');
    electron_1.ipcMain.handle('voice:speech', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.voice.speech(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── workflow ──────────────────────────────────────
    electron_1.ipcMain.removeHandler('workflow:list');
    electron_1.ipcMain.handle('workflow:list', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.workflow.list() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('workflow:get');
    electron_1.ipcMain.handle('workflow:get', async (_event, workflowId) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.workflow.get(workflowId) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('workflow:run');
    electron_1.ipcMain.handle('workflow:run', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.workflow.run(params.workflowId, params.payload ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── agent ────────────────────────────────────────
    electron_1.ipcMain.removeHandler('agent:listTools');
    electron_1.ipcMain.handle('agent:listTools', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.agent.listTools() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('agent:listMyAgents');
    electron_1.ipcMain.handle('agent:listMyAgents', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.agent.listMyAgents() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('agent:create');
    electron_1.ipcMain.handle('agent:create', async (_event, payload) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.agent.create(payload) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('agent:listTemplates');
    electron_1.ipcMain.handle('agent:listTemplates', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.agent.listDefaultTemplates() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    // ─── models (管理类，非生成) ───────────────────────
    electron_1.ipcMain.removeHandler('models:listAvailable');
    electron_1.ipcMain.handle('models:listAvailable', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.models.listAvailable() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('models:listProviders');
    electron_1.ipcMain.handle('models:listProviders', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.models.listProviderSummary() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('models:getRouteProfile');
    electron_1.ipcMain.handle('models:getRouteProfile', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.models.getRouteProfile() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('models:getUsage');
    electron_1.ipcMain.handle('models:getUsage', async (_event, params) => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.models.getUsage(params ?? {}) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
    electron_1.ipcMain.removeHandler('models:getQuota');
    electron_1.ipcMain.handle('models:getQuota', async () => {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return { success: true, data: await bridge.models.getQuota() };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    });
}
