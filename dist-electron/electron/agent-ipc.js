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
// 这是一个极其简易的本地文件存取库，用来存储用户教给 Agent 的新知识（即进化逻辑）
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
// 模拟读取项目的 harness 规范 (我们之前建的那些文件)
function getHarnessContext() {
    try {
        const workspaceDir = path.join(process.cwd(), 'harness'); // 假设当前在项目根目录
        let context = "";
        // 如果文件存在就读取并注入提示词
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
function setupRealAgentIPC() {
    // 这里使用 OpenAI SDK 来调用 DeepSeek 或兼容的模型
    const openai = new openai_1.OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || 'sk-3f4124ba166144e590afb20ffeb23789', // 你可以换成你自己的
        baseURL: 'https://api.deepseek.com/v1',
    });
    let conversationHistory = [];
    electron_1.ipcMain.removeHandler('agent:chat');
    electron_1.ipcMain.handle('agent:chat', async (_, message) => {
        try {
            console.log(`[IPC] Sending message to LLM API: ${message}`);
            // 如果用户的话里包含明确的反馈指令（比如 "记住", "下次不要" 等），触发进化机制
            if (message.includes("记住") || message.includes("下次") || message.includes("以后")) {
                saveMemory(message);
                return {
                    success: true,
                    type: 'text',
                    message: '好的！我已经把这个偏好存入我的永久记忆库了，以后生成内容时我都会遵守这个规则。'
                };
            }
            // ==========================================
            // 核心：组装包含 Harness 和 Memory 的超级提示词
            // ==========================================
            const memoryList = loadMemory();
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
${memoryContext}`;
            if (conversationHistory.length === 0) {
                conversationHistory.push({ role: 'system', content: systemPrompt });
            }
            conversationHistory.push({ role: 'user', content: message });
            const completion = await openai.chat.completions.create({
                messages: conversationHistory,
                model: 'deepseek-chat',
                temperature: 0.7,
            });
            const reply = completion.choices[0].message.content || '';
            conversationHistory.push({ role: 'assistant', content: reply });
            // 尝试解析是否为 JSON 卡片格式
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
                // 如果解析失败，说明大模型返回的只是普通文本
            }
            return {
                success: true,
                type: 'text',
                message: reply
            };
        }
        catch (error) {
            console.error('[Agent IPC Error]', error);
            return {
                success: false,
                type: 'text',
                message: `处理请求时发生错误: ${error.message}`
            };
        }
    });
    electron_1.ipcMain.removeHandler('agent:feedback');
    electron_1.ipcMain.handle('agent:feedback', async (_, contentId, action, text) => {
        if (action === 'reject' && text) {
            // 隐性进化逻辑：当用户在 UI 上点击“不满意”并写下理由时，自动存入记忆库
            saveMemory(`对于生成的文案，用户曾反馈不满意：${text}`);
        }
        return { success: true };
    });
}
