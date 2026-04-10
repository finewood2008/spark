/**
 * main.ts - Electron 主进程
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';

// 禁用硬件加速，避免某些机器上的问题
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

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
import { setupRealAgentIPC } from './agent-ipc';

function setupIPC(): void {
  // 使用新的接入真实 Agent (或者 Hermes 子进程) 的实现
  setupRealAgentIPC();

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

  // 读取品牌配置
  ipcMain.handle('brand:load', async (_, brandId: string) => {
    const brandPath = path.join(app.getPath('userData'), 'brands', brandId, 'config.json');
    try {
      const data = await fs.readJson(brandPath);
      return data;
    } catch {
      return null;
    }
  });

  // 保存品牌配置
  ipcMain.handle('brand:save', async (_, brandId: string, config: unknown) => {
    const brandDir = path.join(app.getPath('userData'), 'brands', brandId);
    await fs.ensureDir(brandDir);
    const brandPath = path.join(brandDir, 'config.json');
    await fs.writeJson(brandPath, config);
    return { success: true };
  });

  // 读取知识库
  ipcMain.handle('kb:load', async (_, brandId: string) => {
    const kbPath = path.join(app.getPath('userData'), 'brands', brandId, 'knowledge.json');
    try {
      const data = await fs.readJson(kbPath);
      return data;
    } catch {
      return [];
    }
  });

  // 保存知识库
  ipcMain.handle('kb:save', async (_, brandId: string, knowledge: unknown) => {
    const brandDir = path.join(app.getPath('userData'), 'brands', brandId);
    await fs.ensureDir(brandDir);
    const kbPath = path.join(brandDir, 'knowledge.json');
    await fs.writeJson(kbPath, knowledge);
    return { success: true };
  });
}

// App 生命周期
app.whenReady().then(() => {
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
