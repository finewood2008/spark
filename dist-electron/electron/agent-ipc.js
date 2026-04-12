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
    const openai = new openai_1.OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || 'sk-3f4...3789',
        baseURL: 'https://api.deepseek.com/v1',
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
                // 平台调用失败，走 DeepSeek 直连
            }
            if (!usedPlatform) {
                const completion = await openai.chat.completions.create({
                    messages: conversationHistory,
                    model: 'deepseek-chat',
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
}
