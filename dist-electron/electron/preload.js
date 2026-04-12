"use strict";
/**
 * preload.ts - 预加载脚本
 *
 * 在浏览器和 Node.js 之间建立安全的通信桥接
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露给渲染进程的 API
electron_1.contextBridge.exposeInMainWorld('spark', {
    // 文件操作
    dialog: {
        openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
        openImage: () => electron_1.ipcRenderer.invoke('dialog:openImage'),
    },
    // 应用信息
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    },
    // 品牌配置
    brand: {
        load: (brandId) => electron_1.ipcRenderer.invoke('brand:load', brandId),
        save: (brandId, config) => electron_1.ipcRenderer.invoke('brand:save', brandId, config),
    },
    // 知识库（本地）
    kb: {
        load: (brandId) => electron_1.ipcRenderer.invoke('kb:load', brandId),
        save: (brandId, knowledge) => electron_1.ipcRenderer.invoke('kb:save', brandId, knowledge),
    },
    // Agent 交互
    agent: {
        chat: (message) => electron_1.ipcRenderer.invoke('agent:chat', message),
        feedback: (contentId, action, text) => electron_1.ipcRenderer.invoke('agent:feedback', contentId, action, text),
        listTools: () => electron_1.ipcRenderer.invoke('agent:listTools'),
        listMyAgents: () => electron_1.ipcRenderer.invoke('agent:listMyAgents'),
        create: (payload) => electron_1.ipcRenderer.invoke('agent:create', payload),
        listTemplates: () => electron_1.ipcRenderer.invoke('agent:listTemplates'),
    },
    // 内容生成（SDK 优先 + fallback）
    content: {
        generate: (params) => electron_1.ipcRenderer.invoke('content:generate', params),
    },
    // 视频生成（SDK 优先 + fallback）
    video: {
        generate: (params) => electron_1.ipcRenderer.invoke('video:generate', params),
    },
    // 工作台生成（SDK 优先 + fallback）
    workspace: {
        generate: (params) => electron_1.ipcRenderer.invoke('workspace:generate', params),
    },
    // 知识库管理（SDK 优先 + 本地 RAG fallback）
    knowledge: {
        list: (params) => electron_1.ipcRenderer.invoke('knowledge:list', params),
        search: (params) => electron_1.ipcRenderer.invoke('knowledge:search', params),
        ingest: (params) => electron_1.ipcRenderer.invoke('knowledge:ingest', params),
        delete: (params) => electron_1.ipcRenderer.invoke('knowledge:delete', params),
        stats: (params) => electron_1.ipcRenderer.invoke('knowledge:stats', params),
    },
    // ═══════════════════════════════════════════════════════════
    //  QeeClaw 平台管理模块 — 纯 SDK 调用
    // ═══════════════════════════════════════════════════════════
    // 计费
    billing: {
        getWallet: () => electron_1.ipcRenderer.invoke('billing:getWallet'),
        listRecords: (params) => electron_1.ipcRenderer.invoke('billing:listRecords', params),
        getSummary: () => electron_1.ipcRenderer.invoke('billing:getSummary'),
    },
    // 用户 / IAM
    iam: {
        getProfile: () => electron_1.ipcRenderer.invoke('iam:getProfile'),
        updateProfile: (payload) => electron_1.ipcRenderer.invoke('iam:updateProfile', payload),
        updatePreference: (preferredModel) => electron_1.ipcRenderer.invoke('iam:updatePreference', preferredModel),
        listUsers: (params) => electron_1.ipcRenderer.invoke('iam:listUsers', params),
        listProducts: () => electron_1.ipcRenderer.invoke('iam:listProducts'),
    },
    // API Key 管理
    apikey: {
        list: (params) => electron_1.ipcRenderer.invoke('apikey:list', params),
        create: () => electron_1.ipcRenderer.invoke('apikey:create'),
        remove: (appKeyId) => electron_1.ipcRenderer.invoke('apikey:remove', appKeyId),
        rename: (params) => electron_1.ipcRenderer.invoke('apikey:rename', params),
        listLLMKeys: () => electron_1.ipcRenderer.invoke('apikey:listLLMKeys'),
        createLLMKey: (payload) => electron_1.ipcRenderer.invoke('apikey:createLLMKey', payload),
        removeLLMKey: (keyId) => electron_1.ipcRenderer.invoke('apikey:removeLLMKey', keyId),
    },
    // 租户 / 工作空间
    tenant: {
        getCurrentContext: () => electron_1.ipcRenderer.invoke('tenant:getCurrentContext'),
        getCompanyVerification: () => electron_1.ipcRenderer.invoke('tenant:getCompanyVerification'),
    },
    // 设备管理
    devices: {
        list: () => electron_1.ipcRenderer.invoke('devices:list'),
        getOnlineState: () => electron_1.ipcRenderer.invoke('devices:getOnlineState'),
        createPairCode: () => electron_1.ipcRenderer.invoke('devices:createPairCode'),
        claim: (payload) => electron_1.ipcRenderer.invoke('devices:claim', payload),
        remove: (deviceId) => electron_1.ipcRenderer.invoke('devices:remove', deviceId),
    },
    // 渠道
    channels: {
        getOverview: (teamId) => electron_1.ipcRenderer.invoke('channels:getOverview', teamId),
        list: (teamId) => electron_1.ipcRenderer.invoke('channels:list', teamId),
        listBindings: (params) => electron_1.ipcRenderer.invoke('channels:listBindings', params),
    },
    // 对话
    conversations: {
        getHome: (params) => electron_1.ipcRenderer.invoke('conversations:getHome', params),
        getStats: (teamId) => electron_1.ipcRenderer.invoke('conversations:getStats', teamId),
        listGroups: (params) => electron_1.ipcRenderer.invoke('conversations:listGroups', params),
        listHistory: (params) => electron_1.ipcRenderer.invoke('conversations:listHistory', params),
        sendMessage: (payload) => electron_1.ipcRenderer.invoke('conversations:sendMessage', payload),
    },
    // 审计
    audit: {
        record: (payload) => electron_1.ipcRenderer.invoke('audit:record', payload),
        listEvents: (params) => electron_1.ipcRenderer.invoke('audit:listEvents', params),
        getSummary: (params) => electron_1.ipcRenderer.invoke('audit:getSummary', params),
    },
    // 策略
    policy: {
        checkToolAccess: (payload) => electron_1.ipcRenderer.invoke('policy:checkToolAccess', payload),
        checkExecAccess: (payload) => electron_1.ipcRenderer.invoke('policy:checkExecAccess', payload),
    },
    // 审批
    approval: {
        request: (payload) => electron_1.ipcRenderer.invoke('approval:request', payload),
        list: (params) => electron_1.ipcRenderer.invoke('approval:list', params),
        get: (approvalId) => electron_1.ipcRenderer.invoke('approval:get', approvalId),
        resolve: (params) => electron_1.ipcRenderer.invoke('approval:resolve', params),
    },
    // 文件/文档
    file: {
        listDocuments: (params) => electron_1.ipcRenderer.invoke('file:listDocuments', params),
        getDocument: (documentId) => electron_1.ipcRenderer.invoke('file:getDocument', documentId),
    },
    // 语音
    voice: {
        transcribe: (payload) => electron_1.ipcRenderer.invoke('voice:transcribe', payload),
        synthesize: (payload) => electron_1.ipcRenderer.invoke('voice:synthesize', payload),
        speech: (payload) => electron_1.ipcRenderer.invoke('voice:speech', payload),
    },
    // 工作流
    workflow: {
        list: () => electron_1.ipcRenderer.invoke('workflow:list'),
        get: (workflowId) => electron_1.ipcRenderer.invoke('workflow:get', workflowId),
        run: (params) => electron_1.ipcRenderer.invoke('workflow:run', params),
    },
    // 模型管理（非生成，查询类）
    models: {
        listAvailable: () => electron_1.ipcRenderer.invoke('models:listAvailable'),
        listProviders: () => electron_1.ipcRenderer.invoke('models:listProviders'),
        getRouteProfile: () => electron_1.ipcRenderer.invoke('models:getRouteProfile'),
        getUsage: (params) => electron_1.ipcRenderer.invoke('models:getUsage', params),
        getQuota: () => electron_1.ipcRenderer.invoke('models:getQuota'),
    },
});
