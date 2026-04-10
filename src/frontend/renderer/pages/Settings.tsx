/**
 * Settings.tsx - 设置面板
 */
import React, { useState } from 'react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('agent');

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-gray-100 text-gray-500 border-gray-200">⚙️</span>
          <div>
            <div className="page-title">系统设置</div>
            <div className="page-subtitle">模型配置 · 偏好与系统状态</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary">保存配置</button>
        </div>
      </div>

      <div className="tabs">
        {['模型配置 (Agent)', '通用设置', '关于系统'].map(t => (
          <button 
            key={t} 
            className={`tab-btn ${activeTab === (t.includes('模型') ? 'agent' : t.includes('通用') ? 'general' : 'about') ? 'active' : ''}`} 
            onClick={() => setActiveTab(t.includes('模型') ? 'agent' : t.includes('通用') ? 'general' : 'about')}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {activeTab === 'agent' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card">
              <div className="card-header"><h3 className="card-title">LLM 大语言模型设置</h3></div>
              <div className="card-body space-y-4">
                <div className="form-group">
                  <label className="form-label">供应商 / Provider</label>
                  <select className="form-select">
                    <option>DeepSeek API</option>
                    <option>OpenAI API</option>
                    <option>Ollama (Local)</option>
                    <option>Custom Hermes Endpoint</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input type="password" placeholder="sk-..." className="form-input" value="sk-mocked-key-for-ui-display" readOnly />
                  <p className="text-xs text-gray-400 mt-1">你的 API Key 仅保存在本地存储中。</p>
                </div>
                <div className="form-group">
                  <label className="form-label">模型选择 / Model</label>
                  <input type="text" className="form-input" value="deepseek-chat" readOnly />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">Agent 记忆与 Harness</h3></div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">本地记忆库</h4>
                    <p className="text-xs text-gray-500">Alex 记住的您的个性化要求</p>
                  </div>
                  <button className="btn btn-secondary text-xs">清除记忆</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Harness 规范引擎</h4>
                    <p className="text-xs text-gray-500">从项目目录加载的视觉与语气规范</p>
                  </div>
                  <span className="badge badge-success">已启用</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-6">S</div>
            <h2 className="text-2xl font-bold text-gray-900">火花 Spark</h2>
            <p className="text-gray-500 mt-2">让每个中小企业都能拥有专业的品牌营销资产。</p>
            <div className="mt-8 text-sm text-gray-400">
              <p>UI 版本: 1.0.0 (Agent-UI 版)</p>
              <p>前端框架: React + Vite + TailwindCSS</p>
              <p>桌面环境: Electron</p>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
           <div className="text-gray-400 text-sm flex items-center justify-center h-40 animate-fade-in">
              此处为通用的软件设置，如开机自启、主题颜色等。
           </div>
        )}
      </div>
    </div>
  );
}