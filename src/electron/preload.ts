/**
 * preload.ts - 预加载脚本
 * 
 * 在浏览器和 Node.js 之间建立安全的通信桥接
 */

import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('spark', {
  // 文件操作
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
  },

  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  // 品牌配置
  brand: {
    load: (brandId: string) => ipcRenderer.invoke('brand:load', brandId),
    save: (brandId: string, config: unknown) => ipcRenderer.invoke('brand:save', brandId, config),
  },

  // 知识库（本地）
  kb: {
    load: (brandId: string) => ipcRenderer.invoke('kb:load', brandId),
    save: (brandId: string, knowledge: unknown) => ipcRenderer.invoke('kb:save', brandId, knowledge),
  },

  // Agent 交互
  agent: {
    chat: (message: string) => ipcRenderer.invoke('agent:chat', message),
    updateConfig: (config: any) => ipcRenderer.invoke('agent:updateConfig', config),
    feedback: (contentId: string, action: string, text?: string) => ipcRenderer.invoke('agent:feedback', contentId, action, text),
    listTools: () => ipcRenderer.invoke('agent:listTools'),
    listMyAgents: () => ipcRenderer.invoke('agent:listMyAgents'),
    create: (payload: { name: string; systemPrompt?: string; model?: string; tools?: string[] }) => ipcRenderer.invoke('agent:create', payload),
    listTemplates: () => ipcRenderer.invoke('agent:listTemplates'),
  },

  // 内容生成（SDK 优先 + fallback）
  content: {
    generate: (params: { topic: string; platforms: string[]; style: string; brandContext?: string }) =>
      ipcRenderer.invoke('content:generate', params),
  },

  // 视频生成（SDK 优先 + fallback）
  video: {
    generate: (params: { topic: string; platforms: string[]; style: string; ratio: string; bgm: string }) =>
      ipcRenderer.invoke('video:generate', params),
  },

  // 工作台生成（SDK 优先 + fallback）
  workspace: {
    generate: (params: { prompt: string; type: string }) =>
      ipcRenderer.invoke('workspace:generate', params),
  },

  // 知识库管理（SDK 优先 + 本地 RAG fallback）
  knowledge: {
    list: (params: { brandId: string; page?: number; pageSize?: number }) =>
      ipcRenderer.invoke('knowledge:list', params),
    search: (params: { brandId: string; query: string; limit?: number }) =>
      ipcRenderer.invoke('knowledge:search', params),
    ingest: (params: { brandId: string; content: string; sourceName: string; category?: string }) =>
      ipcRenderer.invoke('knowledge:ingest', params),
    delete: (params: { brandId: string; docId: string; sourceName?: string }) =>
      ipcRenderer.invoke('knowledge:delete', params),
    stats: (params: { brandId: string }) =>
      ipcRenderer.invoke('knowledge:stats', params),
  },

  // ═══════════════════════════════════════════════════════════
  //  QeeClaw 平台管理模块 — 纯 SDK 调用
  // ═══════════════════════════════════════════════════════════

  // 计费
  billing: {
    getWallet: () => ipcRenderer.invoke('billing:getWallet'),
    listRecords: (params?: { page?: number; pageSize?: number }) => ipcRenderer.invoke('billing:listRecords', params),
    getSummary: () => ipcRenderer.invoke('billing:getSummary'),
  },

  // 用户 / IAM
  iam: {
    getProfile: () => ipcRenderer.invoke('iam:getProfile'),
    updateProfile: (payload: { nickname?: string; avatar?: string }) => ipcRenderer.invoke('iam:updateProfile', payload),
    updatePreference: (preferredModel: string) => ipcRenderer.invoke('iam:updatePreference', preferredModel),
    listUsers: (params?: { page?: number; pageSize?: number }) => ipcRenderer.invoke('iam:listUsers', params),
    listProducts: () => ipcRenderer.invoke('iam:listProducts'),
  },

  // API Key 管理
  apikey: {
    list: (params?: { page?: number; pageSize?: number }) => ipcRenderer.invoke('apikey:list', params),
    create: () => ipcRenderer.invoke('apikey:create'),
    remove: (appKeyId: number) => ipcRenderer.invoke('apikey:remove', appKeyId),
    rename: (params: { appKeyId: number; keyName: string }) => ipcRenderer.invoke('apikey:rename', params),
    listLLMKeys: () => ipcRenderer.invoke('apikey:listLLMKeys'),
    createLLMKey: (payload: { providerName: string; keyValue: string; label?: string }) => ipcRenderer.invoke('apikey:createLLMKey', payload),
    removeLLMKey: (keyId: number) => ipcRenderer.invoke('apikey:removeLLMKey', keyId),
  },

  // 租户 / 工作空间
  tenant: {
    getCurrentContext: () => ipcRenderer.invoke('tenant:getCurrentContext'),
    getCompanyVerification: () => ipcRenderer.invoke('tenant:getCompanyVerification'),
  },

  // 设备管理
  devices: {
    list: () => ipcRenderer.invoke('devices:list'),
    getOnlineState: () => ipcRenderer.invoke('devices:getOnlineState'),
    createPairCode: () => ipcRenderer.invoke('devices:createPairCode'),
    claim: (payload: { pairCode: string; deviceName?: string }) => ipcRenderer.invoke('devices:claim', payload),
    remove: (deviceId: number) => ipcRenderer.invoke('devices:remove', deviceId),
  },

  // 渠道
  channels: {
    getOverview: (teamId: number) => ipcRenderer.invoke('channels:getOverview', teamId),
    list: (teamId: number) => ipcRenderer.invoke('channels:list', teamId),
    listBindings: (params: { teamId: number; channelKey?: string }) => ipcRenderer.invoke('channels:listBindings', params),
  },

  // 对话
  conversations: {
    getHome: (params: { teamId: number; groupLimit?: number; historyLimit?: number }) => ipcRenderer.invoke('conversations:getHome', params),
    getStats: (teamId: number) => ipcRenderer.invoke('conversations:getStats', teamId),
    listGroups: (params: { teamId: number; page?: number; pageSize?: number }) => ipcRenderer.invoke('conversations:listGroups', params),
    listHistory: (params: { teamId: number; page?: number; pageSize?: number }) => ipcRenderer.invoke('conversations:listHistory', params),
    sendMessage: (payload: { teamId: number; roomId: string; content: string; messageType?: string }) => ipcRenderer.invoke('conversations:sendMessage', payload),
  },

  // 审计
  audit: {
    record: (payload: { actionType: string; title: string; module: string; detail?: string }) => ipcRenderer.invoke('audit:record', payload),
    listEvents: (params?: { scope?: string; category?: string; keyword?: string; page?: number; pageSize?: number }) => ipcRenderer.invoke('audit:listEvents', params),
    getSummary: (params?: { scope?: string; category?: string }) => ipcRenderer.invoke('audit:getSummary', params),
  },

  // 策略
  policy: {
    checkToolAccess: (payload: { toolName: string; teamId?: number; agentId?: string }) => ipcRenderer.invoke('policy:checkToolAccess', payload),
    checkExecAccess: (payload: { command: string; riskLevel?: string }) => ipcRenderer.invoke('policy:checkExecAccess', payload),
  },

  // 审批
  approval: {
    request: (payload: { approvalType: string; title: string; reason: string; riskLevel?: string; payload?: Record<string, unknown> }) => ipcRenderer.invoke('approval:request', payload),
    list: (params?: { status?: string; approvalType?: string; page?: number; pageSize?: number }) => ipcRenderer.invoke('approval:list', params),
    get: (approvalId: string) => ipcRenderer.invoke('approval:get', approvalId),
    resolve: (params: { approvalId: string; decision: string; comment?: string }) => ipcRenderer.invoke('approval:resolve', params),
  },

  // 文件/文档
  file: {
    listDocuments: (params?: { page?: number; pageSize?: number }) => ipcRenderer.invoke('file:listDocuments', params),
    getDocument: (documentId: number) => ipcRenderer.invoke('file:getDocument', documentId),
  },

  // 语音
  voice: {
    transcribe: (payload: { audioBase64: string; language?: string; format?: string }) => ipcRenderer.invoke('voice:transcribe', payload),
    synthesize: (payload: { text: string; voice?: string; speed?: number }) => ipcRenderer.invoke('voice:synthesize', payload),
    speech: (payload: { text: string; model?: string; voice?: string; speed?: number }) => ipcRenderer.invoke('voice:speech', payload),
  },

  // 工作流
  workflow: {
    list: () => ipcRenderer.invoke('workflow:list'),
    get: (workflowId: string) => ipcRenderer.invoke('workflow:get', workflowId),
    run: (params: { workflowId: string; payload?: Record<string, unknown> }) => ipcRenderer.invoke('workflow:run', params),
  },

  // 模型管理（非生成，查询类）
  models: {
    listAvailable: () => ipcRenderer.invoke('models:listAvailable'),
    listProviders: () => ipcRenderer.invoke('models:listProviders'),
    getRouteProfile: () => ipcRenderer.invoke('models:getRouteProfile'),
    getUsage: (params?: { days?: number }) => ipcRenderer.invoke('models:getUsage', params),
    getQuota: () => ipcRenderer.invoke('models:getQuota'),
  },

  // GitHub 同步与 Issues
  github: {
    getRepo: () => ipcRenderer.invoke('github:getRepo'),
    listIssues: (params?: { state?: string; page?: number; perPage?: number }) => ipcRenderer.invoke('github:listIssues', params),
    createIssue: (payload: { title: string; body?: string; labels?: string[] }) => ipcRenderer.invoke('github:createIssue', payload),
    sync: () => ipcRenderer.invoke('github:sync'),
  },
});

// 类型声明
declare global {
  interface Window {
    spark: {
      dialog: {
        openFile: () => Promise<Electron.OpenDialogReturnValue>;
        openImage: () => Promise<string | null>;
      };
      app: {
        getVersion: () => Promise<string>;
      };
      brand: {
        load: (brandId: string) => Promise<unknown>;
        save: (brandId: string, config: unknown) => Promise<{ success: boolean }>;
      };
      kb: {
        load: (brandId: string) => Promise<unknown[]>;
        save: (brandId: string, knowledge: unknown) => Promise<{ success: boolean }>;
      };
      agent: {
        chat: (message: string) => Promise<any>;
        updateConfig: (config: { proxyUrl: string, apiKey: string, model: string }) => Promise<any>;
        feedback: (contentId: string, action: string, text?: string) => Promise<any>;
        listTools: () => Promise<any>;
        listMyAgents: () => Promise<any>;
        create: (payload: { name: string; systemPrompt?: string; model?: string; tools?: string[] }) => Promise<any>;
        listTemplates: () => Promise<any>;
      };
      content: {
        generate: (params: { topic: string; platforms: string[]; style: string; brandContext?: string }) => Promise<any>;
      };
      video: {
        generate: (params: { topic: string; platforms: string[]; style: string; ratio: string; bgm: string }) => Promise<any>;
      };
      workspace: {
        generate: (params: { prompt: string; type: string }) => Promise<any>;
      };
      knowledge: {
        list: (params: { brandId: string; page?: number; pageSize?: number }) => Promise<any>;
        search: (params: { brandId: string; query: string; limit?: number }) => Promise<any>;
        ingest: (params: { brandId: string; content: string; sourceName: string; category?: string }) => Promise<any>;
        delete: (params: { brandId: string; docId: string; sourceName?: string }) => Promise<any>;
        stats: (params: { brandId: string }) => Promise<any>;
      };
      billing: {
        getWallet: () => Promise<any>;
        listRecords: (params?: { page?: number; pageSize?: number }) => Promise<any>;
        getSummary: () => Promise<any>;
      };
      iam: {
        getProfile: () => Promise<any>;
        updateProfile: (payload: { nickname?: string; avatar?: string }) => Promise<any>;
        updatePreference: (preferredModel: string) => Promise<any>;
        listUsers: (params?: { page?: number; pageSize?: number }) => Promise<any>;
        listProducts: () => Promise<any>;
      };
      apikey: {
        list: (params?: { page?: number; pageSize?: number }) => Promise<any>;
        create: () => Promise<any>;
        remove: (appKeyId: number) => Promise<any>;
        rename: (params: { appKeyId: number; keyName: string }) => Promise<any>;
        listLLMKeys: () => Promise<any>;
        createLLMKey: (payload: { providerName: string; keyValue: string; label?: string }) => Promise<any>;
        removeLLMKey: (keyId: number) => Promise<any>;
      };
      tenant: {
        getCurrentContext: () => Promise<any>;
        getCompanyVerification: () => Promise<any>;
      };
      devices: {
        list: () => Promise<any>;
        getOnlineState: () => Promise<any>;
        createPairCode: () => Promise<any>;
        claim: (payload: { pairCode: string; deviceName?: string }) => Promise<any>;
        remove: (deviceId: number) => Promise<any>;
      };
      channels: {
        getOverview: (teamId: number) => Promise<any>;
        list: (teamId: number) => Promise<any>;
        listBindings: (params: { teamId: number; channelKey?: string }) => Promise<any>;
      };
      conversations: {
        getHome: (params: { teamId: number; groupLimit?: number; historyLimit?: number }) => Promise<any>;
        getStats: (teamId: number) => Promise<any>;
        listGroups: (params: { teamId: number; page?: number; pageSize?: number }) => Promise<any>;
        listHistory: (params: { teamId: number; page?: number; pageSize?: number }) => Promise<any>;
        sendMessage: (payload: { teamId: number; roomId: string; content: string; messageType?: string }) => Promise<any>;
      };
      audit: {
        record: (payload: { actionType: string; title: string; module: string; detail?: string }) => Promise<any>;
        listEvents: (params?: { scope?: string; category?: string; keyword?: string; page?: number; pageSize?: number }) => Promise<any>;
        getSummary: (params?: { scope?: string; category?: string }) => Promise<any>;
      };
      policy: {
        checkToolAccess: (payload: { toolName: string; teamId?: number; agentId?: string }) => Promise<any>;
        checkExecAccess: (payload: { command: string; riskLevel?: string }) => Promise<any>;
      };
      approval: {
        request: (payload: { approvalType: string; title: string; reason: string; riskLevel?: string; payload?: Record<string, unknown> }) => Promise<any>;
        list: (params?: { status?: string; approvalType?: string; page?: number; pageSize?: number }) => Promise<any>;
        get: (approvalId: string) => Promise<any>;
        resolve: (params: { approvalId: string; decision: string; comment?: string }) => Promise<any>;
      };
      file: {
        listDocuments: (params?: { page?: number; pageSize?: number }) => Promise<any>;
        getDocument: (documentId: number) => Promise<any>;
      };
      voice: {
        transcribe: (payload: { audioBase64: string; language?: string; format?: string }) => Promise<any>;
        synthesize: (payload: { text: string; voice?: string; speed?: number }) => Promise<any>;
        speech: (payload: { text: string; model?: string; voice?: string; speed?: number }) => Promise<any>;
      };
      workflow: {
        list: () => Promise<any>;
        get: (workflowId: string) => Promise<any>;
        run: (params: { workflowId: string; payload?: Record<string, unknown> }) => Promise<any>;
      };
      models: {
        listAvailable: () => Promise<any>;
        listProviders: () => Promise<any>;
        getRouteProfile: () => Promise<any>;
        getUsage: (params?: { days?: number }) => Promise<any>;
        getQuota: () => Promise<any>;
      };

      // GitHub 同步与 Issues
      github: {
        getRepo: () => Promise<any>;
        listIssues: (params?: { state?: string; page?: number; perPage?: number }) => Promise<any>;
        createIssue: (payload: { title: string; body?: string; labels?: string[] }) => Promise<any>;
        sync: () => Promise<any>;
      };
    };
  }
}
