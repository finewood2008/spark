/**
 * main.ts - Electron 主进程
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { SparkAgent } from './agent/SparkAgent';
import { AIProvider } from './agent/tools/AIProvider';

// 禁用硬件加速，避免某些机器上的问题
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let sparkAgent: SparkAgent | null = null;

// 初始化 Agent
function initAgent(): void {
  const aiProvider = new AIProvider({
    baseUrl: 'https://api.vveai.com/v1',
    apiKey: process.env.VVEAI_API_KEY || '',
    defaultModel: 'claude-sonnet-4-6',
  });

  sparkAgent = new SparkAgent({
    dataPath: path.join(app.getPath('userData'), 'spark-data'),
    aiProvider,
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
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

  // 加载页面
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC 处理器
function setupIPC(): void {
  // 知识库相关
  ipcMain.handle('kb:create', async (_, brandId: string) => {
    await sparkAgent?.initBrand(brandId);
    return { success: true };
  });

  ipcMain.handle('kb:query', async (_, brandId: string, query: string) => {
    return sparkAgent?.processMessage('', query);
  });

  // 内容生成
  ipcMain.handle('content:generate', async (_, params: {
    topic: string;
    platform: string;
    style?: string;
  }) => {
    return sparkAgent?.processMessage('', `生成一篇关于${params.topic}的${params.platform}内容`);
  });

  // 文件选择
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  });

  // 获取应用版本
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
}

// App 生命周期
app.whenReady().then(() => {
  initAgent();
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
