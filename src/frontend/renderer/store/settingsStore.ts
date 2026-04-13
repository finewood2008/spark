/**
 * settingsStore.ts - 系统设置与 SDK 平台状态
 *
 * 管理：模型配置、API Key、用户信息、租户上下文、计费状态
 */
import { create } from 'zustand';

export interface ModelInfo {
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  description?: string;
}

export interface ApiKeyInfo {
  id: number;
  name: string;
  key: string; // masked
  createdAt: string;
}

export interface LlmKeyInfo {
  id: number;
  provider: string;
  label: string;
  createdAt: string;
}

export interface UserProfile {
  userId?: number;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface TenantContext {
  teamId: number;
  teamName: string;
  role: string;
  plantype?: string;
}

export interface WalletInfo {
  balance: number;
  currency: string;
  allowance?: number;
  spent?: number;
}

export interface ModelUsage {
  date: string;
  tokens: number;
  cost: number;
}

export interface SettingsState {
  // 连接状态
  platformConnected: boolean;
  platformStatus: 'idle' | 'loading' | 'connected' | 'error';
  platformError: string;

  // 模型
  availableModels: ModelInfo[];
  preferredModel: string;
  modelQuota: { used: number; total: number } | null;
  modelUsage: ModelUsage[];

  // API Keys
  apiKeys: ApiKeyInfo[];
  llmKeys: LlmKeyInfo[];

  // 用户与租户
  profile: UserProfile | null;
  tenant: TenantContext | null;
  wallet: WalletInfo | null;

  // 动作
  fetchAll: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchApiKeys: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchTenant: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  updatePreference: (model: string) => Promise<void>;
  clearMemory: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  platformConnected: false,
  platformStatus: 'idle',
  platformError: '',

  availableModels: [],
  preferredModel: '',
  modelQuota: null,
  modelUsage: [],

  apiKeys: [],
  llmKeys: [],

  profile: null,
  tenant: null,
  wallet: null,

  // ─── fetchAll — 首次加载时调用 ────────────────────────
  fetchAll: async () => {
    set({ platformStatus: 'loading' });
    try {
      await Promise.all([
        get().fetchModels(),
        get().fetchApiKeys(),
        get().fetchProfile(),
        get().fetchTenant(),
        get().fetchWallet(),
      ]);
      set({ platformConnected: true, platformStatus: 'connected', platformError: '' });
    } catch (e: any) {
      set({ platformConnected: false, platformStatus: 'error', platformError: e.message });
    }
  },

  // ─── 模型列表 + Quota + 使用量 ────────────────────────
  fetchModels: async () => {
    try {
      const [modelsRes, quotaRes, usageRes] = await Promise.all([
        window.spark.models.listAvailable(),
        window.spark.models.getQuota(),
        window.spark.models.getUsage({ days: 7 }),
      ]);

      if (modelsRes.success) {
        set({ availableModels: modelsRes.data?.models ?? modelsRes.data ?? [] });
      }
      if (quotaRes.success) {
        set({ modelQuota: quotaRes.data ?? null });
      }
      if (usageRes.success) {
        set({ modelUsage: usageRes.data?.daily ?? usageRes.data ?? [] });
      }

      // 读取当前偏好
      const profile = get().profile;
      if (profile) {
        // 偏好由 profile 中读取，这里只处理模型列表
      }
    } catch (e: any) {
      console.warn('[settingsStore] fetchModels failed:', e.message);
    }
  },

  // ─── API Keys ──────────────────────────────────────────
  fetchApiKeys: async () => {
    try {
      const [keysRes, llmKeysRes] = await Promise.all([
        window.spark.apikey.list({ pageSize: 20 }),
        window.spark.apikey.listLLMKeys(),
      ]);

      if (keysRes.success) {
        set({ apiKeys: keysRes.data?.items ?? keysRes.data ?? [] });
      }
      if (llmKeysRes.success) {
        set({ llmKeys: llmKeysRes.data ?? [] });
      }
    } catch (e: any) {
      console.warn('[settingsStore] fetchApiKeys failed:', e.message);
    }
  },

  // ─── 用户 Profile ───────────────────────────────────────
  fetchProfile: async () => {
    try {
      const res = await window.spark.iam.getProfile();
      if (res.success) {
        const d = res.data;
        set({
          profile: {
            userId: d.userId ?? d.id,
            nickname: d.nickname ?? d.fullName ?? d.name,
            email: d.email,
            phone: d.phone,
            avatar: d.avatar,
            createdAt: d.createdAt,
          },
          preferredModel: d.preferredModel ?? '',
        });
      }
    } catch (e: any) {
      console.warn('[settingsStore] fetchProfile failed:', e.message);
    }
  },

  // ─── 租户上下文 ─────────────────────────────────────────
  fetchTenant: async () => {
    try {
      const res = await window.spark.tenant.getCurrentContext();
      if (res.success) {
        const d = res.data;
        set({
          tenant: {
            teamId: d.teamId ?? d.id,
            teamName: d.teamName ?? d.name ?? '未命名团队',
            role: d.role ?? 'member',
            plantype: d.planType ?? d.plan ?? d.plantype,
          },
        });
      }
    } catch (e: any) {
      console.warn('[settingsStore] fetchTenant failed:', e.message);
    }
  },

  // ─── 钱包 / 计费 ────────────────────────────────────────
  fetchWallet: async () => {
    try {
      const res = await window.spark.billing.getWallet();
      if (res.success) {
        const d = res.data;
        set({
          wallet: {
            balance: d.balance ?? 0,
            currency: d.currency ?? 'CNY',
            allowance: d.allowance,
            spent: d.spent,
          },
        });
      }
    } catch (e: any) {
      console.warn('[settingsStore] fetchWallet failed:', e.message);
    }
  },

  // ─── 更新模型偏好 ───────────────────────────────────────
  updatePreference: async (model: string) => {
    try {
      await window.spark.iam.updatePreference(model);
      set({ preferredModel: model });
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  // ─── 清除本地记忆 ──────────────────────────────────────
  clearMemory: async () => {
    try {
      const res = await window.spark.knowledge.ingest({
        brandId: '__system__',
        content: '__CLEAR_MEMORY__',
        sourceName: 'settings',
      });
      if (!res.success) throw new Error(res.error);
    } catch (e: any) {
      throw new Error(e.message);
    }
  },
}));
