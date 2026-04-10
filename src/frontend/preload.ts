/**
 * preload.ts - 预加载脚本
 * 
 * 在浏览器和 Node.js 之间建立安全的通信桥接
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

// 类型声明
declare global {
  interface Window {
    spark: {
      knowledge: {
        create: (brandId: string) => Promise<{ success: boolean }>;
        query: (brandId: string, query: string) => Promise<unknown>;
      };
      content: {
        generate: (params: {
          topic: string;
          platform: string;
          style?: string;
        }) => Promise<unknown>;
      };
      dialog: {
        openFile: () => Promise<Electron.OpenDialogReturnValue>;
      };
      app: {
        getVersion: () => Promise<string>;
      };
    };
  }
}
