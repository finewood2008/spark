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

  // 知识库
  kb: {
    load: (brandId: string) => ipcRenderer.invoke('kb:load', brandId),
    save: (brandId: string, knowledge: unknown) => ipcRenderer.invoke('kb:save', brandId, knowledge),
  },

  // Agent 交互
  agent: {
    chat: (message: string) => ipcRenderer.invoke('agent:chat', message),
    feedback: (contentId: string, action: string, text?: string) => ipcRenderer.invoke('agent:feedback', contentId, action, text),
  }
});

// 类型声明
declare global {
  interface Window {
    spark: {
      dialog: {
        openFile: () => Promise<Electron.OpenDialogReturnValue>;
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
        feedback: (contentId: string, action: string, text?: string) => Promise<any>;
      };
    };
  }
}