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
    // 知识库
    kb: {
        load: (brandId) => electron_1.ipcRenderer.invoke('kb:load', brandId),
        save: (brandId, knowledge) => electron_1.ipcRenderer.invoke('kb:save', brandId, knowledge),
    },
    // Agent 交互
    agent: {
        chat: (message) => electron_1.ipcRenderer.invoke('agent:chat', message),
        feedback: (contentId, action, text) => electron_1.ipcRenderer.invoke('agent:feedback', contentId, action, text),
    }
});
