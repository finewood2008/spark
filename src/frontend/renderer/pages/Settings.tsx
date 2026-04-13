/**
 * Settings.tsx - 设置面板（SDK 集成版）
 */
import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { LocalApiConfig } from './Settings/LocalApiConfig';
import { PlatformKeyConfig } from './Settings/PlatformKeyConfig';

// ─── 小工具 ──────────────────────────────────────
function maskKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 6) + '****' + key.slice(-4);
}

function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// ─── 状态徽章 ──────────────────────────────────────
function StatusBadge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {text}
    </span>
  );
}

// ─── Tab: 模型配置 ────────────────────────────────
function AgentTab() {
  const {
    platformConnected, platformStatus,
    availableModels, preferredModel, modelQuota, modelUsage,
    apiKeys, llmKeys,
    fetchModels, fetchApiKeys, updatePreference, clearMemory,
  } = useSettingsStore();

  const [savingPref, setSavingPref] = useState(false);
  const [clearingMem, setClearingMem] = useState(false);
  const [memMsg, setMemMsg] = useState('');

  const handleClearMemory = async () => {
    if (!confirm('确定要清除所有品牌记忆吗？此操作不可恢复。')) return;
    setClearingMem(true);
    setMemMsg('');
    try {
      await clearMemory();
      setMemMsg('记忆已清除');
    } catch (e: any) {
      setMemMsg('清除失败: ' + e.message);
    } finally {
      setClearingMem(false);
      setTimeout(() => setMemMsg(''), 3000);
    }
  };

  const totalTokens = modelUsage.reduce((s, d) => s + (d.tokens ?? 0), 0);
  const totalCost = modelUsage.reduce((s, d) => s + (d.cost ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* 平台连接状态 */}
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">QeeClaw 平台连接</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {platformConnected ? '已连接到 QeeClaw 云端平台，所有功能可用' : '未连接或连接失败，将使用本地模式'}
            </p>
          </div>
          <StatusBadge ok={platformConnected} text={platformConnected ? '已连接' : '离线'} />
        </div>
      </div>

      {/* LLM 模型 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">大语言模型 (云端配额)</h3>
          <button className="btn btn-secondary text-xs" onClick={fetchModels} disabled={!platformConnected}>
            刷新
          </button>
        </div>
        <div className="card-body space-y-4">
          <div className="form-group">
            <label className="form-label">当前使用模型</label>
            <select
              className="form-select"
              value={preferredModel}
              onChange={async e => {
                setSavingPref(true);
                try {
                  await updatePreference(e.target.value);
                } finally {
                  setSavingPref(false);
                }
              }}
              disabled={!platformConnected}
            >
              <option value="">默认模型（平台自动路由）</option>
              {availableModels.map(m => (
                <option key={m.name} value={m.name}>{m.name} ({m.provider})</option>
              ))}
            </select>
            {savingPref && <p className="text-xs text-orange-500 mt-1">保存中...</p>}
          </div>

          {/* Quota */}
          {modelQuota && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">已使用额度</p>
                <p className="text-lg font-bold text-gray-900">{modelQuota.used.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">额度上限</p>
                <p className="text-lg font-bold text-gray-900">{modelQuota.total.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* 7天用量 */}
          {modelUsage.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">近7天使用量</p>
              <div className="flex items-end gap-1 h-16">
                {modelUsage.slice(-7).map((d, i) => {
                  const max = Math.max(...modelUsage.slice(-7).map(x => x.tokens));
                  const pct = max > 0 ? (d.tokens / max) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full bg-orange-100 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }} />
                      <span className="text-xs text-gray-400">{new Date(d.date).getDate()}日</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                共 {totalTokens.toLocaleString()} tokens，约 {formatCurrency(totalCost)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">API Key 管理</h3>
          <button className="btn btn-secondary text-xs" onClick={fetchApiKeys} disabled={!platformConnected}>
            刷新
          </button>
        </div>
        <div className="card-body space-y-3">
          {apiKeys.length === 0 && llmKeys.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">暂无 API Key</p>
          ) : (
            <>
              {llmKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{k.provider}</p>
                    <p className="text-xs text-gray-400">{k.label || 'LLM Key'} · {timeAgo(k.createdAt)}</p>
                  </div>
                  <span className="badge badge-success">已配置</span>
                </div>
              ))}
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{k.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{maskKey(k.key)} · {timeAgo(k.createdAt)}</p>
                  </div>
                  <button
                    className="text-xs text-red-400 hover:text-red-600"
                    onClick={async () => {
                      if (!confirm(`确定删除 Key "${k.name}"？`)) return;
                      await window.spark.apikey.remove(k.id);
                      fetchApiKeys();
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </>
          )}
          <button
            className="btn btn-secondary w-full text-xs"
            onClick={async () => {
              const name = prompt('请输入 Key 名称:');
              if (!name) return;
              const res = await window.spark.apikey.create();
              if (res.success) {
                alert(`Key 已创建:\n名称: ${name}\n请复制并妥善保存:\n${res.data?.key ?? res.data}`);
                fetchApiKeys();
              }
            }}
            disabled={!platformConnected}
          >
            + 创建新的 App Key
          </button>
        </div>
      </div>

      {/* 记忆管理 */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">品牌记忆</h3></div>
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h4 className="text-sm font-bold text-gray-800">清除品牌记忆</h4>
              <p className="text-xs text-gray-500">清除火花记住的所有品牌偏好和历史记忆</p>
            </div>
            <button
              className="btn btn-secondary text-xs"
              onClick={handleClearMemory}
              disabled={clearingMem}
            >
              {clearingMem ? '清除中...' : '清除记忆'}
            </button>
          </div>
          {memMsg && <p className="text-xs text-orange-500">{memMsg}</p>}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h4 className="text-sm font-bold text-gray-800">Harness 规范引擎</h4>
              <p className="text-xs text-gray-500">从项目目录加载的视觉与语气规范</p>
            </div>
            <StatusBadge ok={true} text="已启用" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: 通用设置 ────────────────────────────────
function GeneralTab() {
  const { profile, tenant, wallet, fetchProfile, fetchTenant, fetchWallet } = useSettingsStore();
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (profile) setNickname(profile.nickname ?? '');
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await window.spark.iam.updateProfile({ nickname });
      fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PlatformKeyConfig />
      
      {/* 钱包 */}
      {wallet && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">账户余额</h3>
            <button className="btn btn-secondary text-xs" onClick={fetchWallet}>刷新</button>
          </div>
          <div className="card-body">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(wallet.balance, wallet.currency)}</p>
            {(wallet.allowance !== undefined || wallet.spent !== undefined) && (
              <p className="text-xs text-gray-400 mt-1">
                {wallet.allowance !== undefined ? `额度 ${formatCurrency(wallet.allowance, wallet.currency)}` : ''}
                {wallet.spent !== undefined ? ` · 已用 ${formatCurrency(wallet.spent, wallet.currency)}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 用户信息 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">个人信息</h3>
          <button className="btn btn-secondary text-xs" onClick={fetchProfile}>刷新</button>
        </div>
        <div className="card-body space-y-4">
          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              className="form-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="设置你的昵称"
            />
          </div>
          {profile?.email && (
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input className="form-input" value={profile.email} readOnly />
            </div>
          )}
          <button className="btn btn-primary text-xs" onClick={handleSaveProfile} disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* 租户信息 */}
      {tenant && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">当前团队</h3>
            <button className="btn btn-secondary text-xs" onClick={fetchTenant}>刷新</button>
          </div>
          <div className="card-body space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">团队名称</span>
              <span className="text-sm font-bold text-gray-800">{tenant.teamName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">角色</span>
              <span className="text-sm text-gray-800">{tenant.role}</span>
            </div>
            {tenant.plantype && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">套餐</span>
                <span className="badge badge-success">{tenant.plantype}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: 关于系统 ────────────────────────────────
function AboutTab() {
  const { platformConnected, platformStatus } = useSettingsStore();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {/* Logo */}
      <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#FF9F1C] rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-6">
        S
      </div>
      <h2 className="text-2xl font-bold text-gray-900">火花 Spark</h2>
      <p className="text-gray-500 mt-2">让每个中小企业都能拥有专业的品牌营销资产。</p>

      {/* 状态 */}
      <div className="mt-6 flex gap-3">
        <StatusBadge ok={platformConnected} text={platformConnected ? '平台已连接' : '离线模式'} />
      </div>

      <div className="mt-8 text-sm text-gray-400 space-y-1">
        <p>UI 版本: 1.0.0</p>
        <p>前端框架: React + Vite + TailwindCSS</p>
        <p>桌面环境: Electron</p>
        <p>QeeClaw SDK: 0.1.0</p>
        <p>Agent IPC: 17 模块全通</p>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <p className="text-xs text-gray-400 mb-2">技术栈</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['QeeClaw Core SDK', 'Electron', 'React', 'TypeScript', 'Zustand', 'TailwindCSS'].map(t => (
            <span key={t} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────
export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { fetchAll, platformStatus } = useSettingsStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const tabKey = activeTab === 'general' ? 'general' : activeTab === 'about' ? 'about' : 'general';

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon bg-gray-100 text-gray-500 border-gray-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </span>
          <div>
            <div className="page-title">系统设置</div>
            <div className="page-subtitle flex items-center gap-2">
              {platformStatus === 'loading' && <span className="text-xs text-orange-500">加载平台数据中...</span>}
              {platformStatus === 'error' && <span className="text-xs text-red-500">平台连接失败</span>}
              {platformStatus === 'connected' && <span className="text-xs text-gray-400">模型配置 · 偏好与系统状态</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'general', label: '通用设置' },
          { key: 'about', label: '关于系统' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tabKey === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {tabKey === 'general' && <GeneralTab />}
        {tabKey === 'about' && <AboutTab />}
      </div>
    </div>
  );
}
