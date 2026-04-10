"use strict";
/**
 * main.ts - Electron 主进程
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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
// 禁用硬件加速，避免某些机器上的问题
electron_1.app.disableHardwareAcceleration();
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: '火花 Spark',
        backgroundColor: '#1E3A5F',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });
    // 加载页面 - 始终使用本地开发服务器
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// IPC 处理器
const agent_ipc_1 = require("./agent-ipc");
function setupIPC() {
    // 使用新的接入真实 Agent (或者 Hermes 子进程) 的实现
    (0, agent_ipc_1.setupRealAgentIPC)();
    // 文件选择 (通用)
    electron_1.ipcMain.handle('dialog:openFile', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        return result;
    });
    // 图片选择 (返回 Base64 以供前端直接渲染和发给模型)
    electron_1.ipcMain.handle('dialog:openImage', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
            ]
        });
        if (result.canceled || result.filePaths.length === 0)
            return null;
        const filePath = result.filePaths[0];
        const ext = path.extname(filePath).toLowerCase().substring(1);
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        const base64 = await fs.readFile(filePath, 'base64');
        return `data:image/${mimeType};base64,${base64}`;
    });
    // 获取应用版本
    electron_1.ipcMain.handle('app:getVersion', () => {
        return electron_1.app.getVersion();
    });
    // 读取品牌配置
    electron_1.ipcMain.handle('brand:load', async (_, brandId) => {
        const brandPath = path.join(electron_1.app.getPath('userData'), 'brands', brandId, 'config.json');
        try {
            const data = await fs.readJson(brandPath);
            return data;
        }
        catch {
            return null;
        }
    });
    // 保存品牌配置
    electron_1.ipcMain.handle('brand:save', async (_, brandId, config) => {
        const brandDir = path.join(electron_1.app.getPath('userData'), 'brands', brandId);
        await fs.ensureDir(brandDir);
        const brandPath = path.join(brandDir, 'config.json');
        await fs.writeJson(brandPath, config);
        return { success: true };
    });
    // 读取知识库
    electron_1.ipcMain.handle('kb:load', async (_, brandId) => {
        const kbPath = path.join(electron_1.app.getPath('userData'), 'brands', brandId, 'knowledge.json');
        try {
            const data = await fs.readJson(kbPath);
            return data;
        }
        catch {
            return [];
        }
    });
    // 保存知识库
    electron_1.ipcMain.handle('kb:save', async (_, brandId, knowledge) => {
        const brandDir = path.join(electron_1.app.getPath('userData'), 'brands', brandId);
        await fs.ensureDir(brandDir);
        const kbPath = path.join(brandDir, 'knowledge.json');
        await fs.writeJson(kbPath, knowledge);
        return { success: true };
    });
}
// App 生命周期
electron_1.app.whenReady().then(() => {
    setupIPC();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
