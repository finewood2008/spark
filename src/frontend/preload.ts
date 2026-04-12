/**
 * preload.ts - 预加载脚本（前端入口版本）
 * 
 * 在浏览器和 Node.js 之间建立安全的通信桥接
 * 注意：Window.spark 类型声明统一在 src/electron/preload.ts 中定义
 */

import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('spark', {
  // 知识库
  knowledge: {
    create: (brandId: string) => ipcRenderer.invoke('kb:create', brandId),
    query: (brandId: string, query: string) => ipcRenderer.invoke('kb:query', brandId, query),
  },

  // 内容生成
  content: {
    generate: (params: {
      topic: string;
      platform: string;
      style?: string;
    }) => ipcRenderer.invoke('content:generate', params),
  },

  // 文件操作
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },

  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
});
