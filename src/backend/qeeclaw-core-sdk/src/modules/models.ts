import { QeeClawNotImplementedError } from "../errors.js";
import type { HttpClient } from "../client/http-client.js";

export interface QeeClawModelInfo {
  id: number;
  providerName: string;
  modelName: string;
  providerModelId?: string;
  label: string;
  isPreferred: boolean;
  availabilityStatus: string;
  unitPrice?: number;
  outputUnitPrice?: number;
  currency?: string;
  billingMode?: string;
  textUnitChars?: number;
  textMinAmount?: number;
}

interface RawModelInfo {
  id: number;
  provider_name: string;
  model_name: string;
  provider_model_id?: string;
  label: string;
  is_preferred: boolean;
  availability_status: string;
  unit_price?: number;
  output_unit_price?: number;
  currency?: string;
  billing_mode?: string;
  text_unit_chars?: number;
  text_min_amount?: number;
}

export interface ModelInvokeRequest {
  prompt: string;
  modelId?: string;
  model?: string;
}

export interface ModelInvokeResult {
  text: string;
  model?: string;
}

// ---------------------------------------------------------------------------
// Types for streaming, vision, and embedding methods (with Gemini Proxy fallback)
// These support SDK-first with Gemini Proxy fallback while backend endpoints
// are not yet implemented.
// ---------------------------------------------------------------------------

/** A single message in the chat format (OpenAI-compatible). */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
}

/** Content part for multimodal messages (text or image). */
export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

/** Request payload for invokeStream(). */
export interface ModelStreamRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/** Request payload for vision(). */
export interface ModelVisionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/** Request payload for embed(). */
export interface ModelEmbedRequest {
  input: string[];
  model?: string;
}

/** Result returned by embed(). */
export interface ModelEmbedResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

export interface ModelProviderSummary {
  providerName: string;
  configured?: boolean;
  providerStatus?: string;
  visibleCount: number;
  hiddenCount: number;
  disabledCount?: number;
  models: string[];
  preferredModelSupported?: boolean;
  isDefaultRouteProvider?: boolean;
  defaultRouteModel?: string | null;
  defaultRouteProviderModelId?: string | null;
}

export interface ModelRuntimeSummary {
  runtimeType: string;
  runtimeLabel: string;
  runtimeStatus: string;
  runtimeStage: string;
  isDefault: boolean;
  adapterRegistered: boolean;
  bridgeRegistered: boolean;
  onlineTeamCount: number;
  supportsImRelay: boolean;
  supportsDeviceBridge: boolean;
  supportsManagedDownload: boolean;
  notes: string;
}

interface RawModelProviderSummary {
  provider_name: string;
  configured?: boolean;
  provider_status?: string;
  visible_count: number;
  hidden_count: number;
  disabled_count?: number;
  models: string[];
  preferred_model_supported?: boolean;
  is_default_route_provider?: boolean;
  default_route_model?: string | null;
  default_route_provider_model_id?: string | null;
}

interface RawModelRuntimeSummary {
  runtime_type: string;
  runtime_label: string;
  runtime_status: string;
  runtime_stage: string;
  is_default: boolean;
  adapter_registered: boolean;
  bridge_registered: boolean;
  online_team_count: number;
  supports_im_relay: boolean;
  supports_device_bridge: boolean;
  supports_managed_download: boolean;
  notes: string;
}

export interface ModelResolution {
  requestedModel: string;
  resolvedModel: string;
  providerName: string;
  providerModelId: string;
  candidateCount: number;
  selected: QeeClawModelInfo;
}

interface RawModelResolution {
  requested_model: string;
  resolved_model: string;
  provider_name: string;
  provider_model_id: string;
  candidate_count: number;
  selected: RawModelInfo;
}

export interface ModelRouteProfile {
  preferredModel?: string | null;
  preferredModelAvailable: boolean;
  resolvedModel?: string | null;
  resolvedProviderName?: string | null;
  resolvedProviderModelId?: string | null;
  candidateCount: number;
  configuredProviderCount: number;
  availableModelCount: number;
  resolutionReason: string;
  selected?: QeeClawModelInfo | null;
}

interface RawModelRouteProfile {
  preferred_model?: string | null;
  preferred_model_available: boolean;
  resolved_model?: string | null;
  resolved_provider_name?: string | null;
  resolved_provider_model_id?: string | null;
  candidate_count: number;
  configured_provider_count: number;
  available_model_count: number;
  resolution_reason: string;
  selected?: RawModelInfo | null;
}

export interface ModelCurrencyAmount {
  currency: string;
  amount: number;
}

interface RawModelCurrencyAmount {
  currency: string;
  amount: number;
}

export interface ModelUsageBreakdownItem {
  productName: string;
  label: string;
  groupType: string;
  modelName?: string | null;
  providerNames: string[];
  callCount: number;
  textInputChars: number;
  textOutputChars: number;
  durationSeconds: number;
  lastUsedAt?: string | null;
}

interface RawModelUsageBreakdownItem {
  product_name: string;
  label: string;
  group_type: string;
  model_name?: string | null;
  provider_names: string[];
  call_count: number;
  text_input_chars: number;
  text_output_chars: number;
  duration_seconds: number;
  last_used_at?: string | null;
}

export interface ModelUsageSummary {
  windowDays: number;
  periodStart: string;
  periodEnd: string;
  attributionMode: string;
  recordCount: number;
  totalCalls: number;
  totalInputChars: number;
  totalOutputChars: number;
  totalDurationSeconds: number;
  lastUsedAt?: string | null;
  breakdown: ModelUsageBreakdownItem[];
}

interface RawModelUsageSummary {
  window_days: number;
  period_start: string;
  period_end: string;
  attribution_mode: string;
  record_count: number;
  total_calls: number;
  total_input_chars: number;
  total_output_chars: number;
  total_duration_seconds: number;
  last_used_at?: string | null;
  breakdown: RawModelUsageBreakdownItem[];
}

export interface ModelCostBreakdownItem {
  productName: string;
  label: string;
  groupType: string;
  modelName?: string | null;
  providerNames: string[];
  callCount: number;
  amount?: number | null;
  averageAmount?: number | null;
  currency?: string | null;
  currencyBreakdown: ModelCurrencyAmount[];
  lastBilledAt?: string | null;
}

interface RawModelCostBreakdownItem {
  product_name: string;
  label: string;
  group_type: string;
  model_name?: string | null;
  provider_names: string[];
  call_count: number;
  amount?: number | null;
  average_amount?: number | null;
  currency?: string | null;
  currency_breakdown: RawModelCurrencyAmount[];
  last_billed_at?: string | null;
}

export interface ModelCostSummary {
  windowDays: number;
  periodStart: string;
  periodEnd: string;
  attributionMode: string;
  recordCount: number;
  totalAmount?: number | null;
  primaryCurrency?: string | null;
  currencyBreakdown: ModelCurrencyAmount[];
  lastBilledAt?: string | null;
  breakdown: ModelCostBreakdownItem[];
}

interface RawModelCostSummary {
  window_days: number;
  period_start: string;
  period_end: string;
  attribution_mode: string;
  record_count: number;
  total_amount?: number | null;
  primary_currency?: string | null;
  currency_breakdown: RawModelCurrencyAmount[];
  last_billed_at?: string | null;
  breakdown: RawModelCostBreakdownItem[];
}

export interface ModelQuotaSummary {
  walletBalance: number;
  currency: string;
  dailyLimit?: number | null;
  dailySpent: number;
  dailyRemaining?: number | null;
  dailyUnlimited: boolean;
  monthlyLimit?: number | null;
  monthlySpent: number;
  monthlyRemaining?: number | null;
  monthlyUnlimited: boolean;
  updatedTime?: string | null;
}

interface RawModelQuotaSummary {
  wallet_balance: number;
  currency: string;
  daily_limit?: number | null;
  daily_spent: number;
  daily_remaining?: number | null;
  daily_unlimited: boolean;
  monthly_limit?: number | null;
  monthly_spent: number;
  monthly_remaining?: number | null;
  monthly_unlimited: boolean;
  updated_time?: string | null;
}

// Gemini proxy constants — fallback when SDK backend endpoints are unavailable
const GEMINI_PROXY_BASE = "https://gemini-proxy.finewood2008.workers.dev";
const GEMINI_PROXY_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: "Bearer dummy",
};
const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

function mapModelInfo(item: RawModelInfo): QeeClawModelInfo {
  return {
    id: item.id,
    providerName: item.provider_name,
    modelName: item.model_name,
    providerModelId: item.provider_model_id,
    label: item.label,
    isPreferred: item.is_preferred,
    availabilityStatus: item.availability_status,
    unitPrice: item.unit_price,
    outputUnitPrice: item.output_unit_price,
    currency: item.currency,
    billingMode: item.billing_mode,
    textUnitChars: item.text_unit_chars,
    textMinAmount: item.text_min_amount,
  };
}

function mapCurrencyAmount(item: RawModelCurrencyAmount): ModelCurrencyAmount {
  return {
    currency: item.currency,
    amount: item.amount,
  };
}

function mapUsageBreakdown(item: RawModelUsageBreakdownItem): ModelUsageBreakdownItem {
  return {
    productName: item.product_name,
    label: item.label,
    groupType: item.group_type,
    modelName: item.model_name,
    providerNames: item.provider_names ?? [],
    callCount: item.call_count,
    textInputChars: item.text_input_chars,
    textOutputChars: item.text_output_chars,
    durationSeconds: item.duration_seconds,
    lastUsedAt: item.last_used_at,
  };
}

function mapCostBreakdown(item: RawModelCostBreakdownItem): ModelCostBreakdownItem {
  return {
    productName: item.product_name,
    label: item.label,
    groupType: item.group_type,
    modelName: item.model_name,
    providerNames: item.provider_names ?? [],
    callCount: item.call_count,
    amount: item.amount,
    averageAmount: item.average_amount,
    currency: item.currency,
    currencyBreakdown: (item.currency_breakdown ?? []).map(mapCurrencyAmount),
    lastBilledAt: item.last_billed_at,
  };
}

export class ModelsModule {
  constructor(private readonly http: HttpClient) {}

  async listAvailable(): Promise<QeeClawModelInfo[]> {
    const items = await this.http.request<RawModelInfo[]>({
      method: "GET",
      path: "/api/platform/models",
    });

    return items.map(mapModelInfo);
  }

  async resolveForAgent(preferredModel?: string): Promise<QeeClawModelInfo | null> {
    const models = await this.listAvailable();
    if (models.length === 0) {
      return null;
    }

    if (preferredModel) {
      return (
        models.find((item) => item.modelName === preferredModel) ??
        models.find((item) => item.isPreferred) ??
        models[0]
      );
    }

    return models.find((item) => item.isPreferred) ?? models[0];
  }

  async listProviderSummary(): Promise<ModelProviderSummary[]> {
    const items = await this.http.request<RawModelProviderSummary[]>({
      method: "GET",
      path: "/api/platform/models/providers",
    });

    return items.map((item) => ({
      providerName: item.provider_name,
      configured: item.configured,
      providerStatus: item.provider_status,
      visibleCount: item.visible_count,
      hiddenCount: item.hidden_count,
      disabledCount: item.disabled_count,
      models: item.models ?? [],
      preferredModelSupported: item.preferred_model_supported,
      isDefaultRouteProvider: item.is_default_route_provider,
      defaultRouteModel: item.default_route_model,
      defaultRouteProviderModelId: item.default_route_provider_model_id,
    }));
  }

  async listRuntimes(): Promise<ModelRuntimeSummary[]> {
    const items = await this.http.request<RawModelRuntimeSummary[]>({
      method: "GET",
      path: "/api/platform/models/runtimes",
    });

    return items.map((item) => ({
      runtimeType: item.runtime_type,
      runtimeLabel: item.runtime_label,
      runtimeStatus: item.runtime_status,
      runtimeStage: item.runtime_stage,
      isDefault: item.is_default,
      adapterRegistered: item.adapter_registered,
      bridgeRegistered: item.bridge_registered,
      onlineTeamCount: item.online_team_count,
      supportsImRelay: item.supports_im_relay,
      supportsDeviceBridge: item.supports_device_bridge,
      supportsManagedDownload: item.supports_managed_download,
      notes: item.notes,
    }));
  }

  async resolve(modelName: string): Promise<ModelResolution> {
    const result = await this.http.request<RawModelResolution>({
      method: "GET",
      path: "/api/platform/models/resolve",
      query: {
        model_name: modelName,
      },
    });
    return {
      requestedModel: result.requested_model,
      resolvedModel: result.resolved_model,
      providerName: result.provider_name,
      providerModelId: result.provider_model_id,
      candidateCount: result.candidate_count,
      selected: mapModelInfo(result.selected),
    };
  }

  async getRouteProfile(): Promise<ModelRouteProfile> {
    const result = await this.http.request<RawModelRouteProfile>({
      method: "GET",
      path: "/api/platform/models/route",
    });
    return {
      preferredModel: result.preferred_model,
      preferredModelAvailable: result.preferred_model_available,
      resolvedModel: result.resolved_model,
      resolvedProviderName: result.resolved_provider_name,
      resolvedProviderModelId: result.resolved_provider_model_id,
      candidateCount: result.candidate_count,
      configuredProviderCount: result.configured_provider_count,
      availableModelCount: result.available_model_count,
      resolutionReason: result.resolution_reason,
      selected: result.selected ? mapModelInfo(result.selected) : null,
    };
  }

  async setDefaultRoute(preferredModel: string): Promise<ModelRouteProfile> {
    const result = await this.http.request<RawModelRouteProfile>({
      method: "PUT",
      path: "/api/platform/models/route",
      body: {
        preferred_model: preferredModel,
      },
    });
    return {
      preferredModel: result.preferred_model,
      preferredModelAvailable: result.preferred_model_available,
      resolvedModel: result.resolved_model,
      resolvedProviderName: result.resolved_provider_name,
      resolvedProviderModelId: result.resolved_provider_model_id,
      candidateCount: result.candidate_count,
      configuredProviderCount: result.configured_provider_count,
      availableModelCount: result.available_model_count,
      resolutionReason: result.resolution_reason,
      selected: result.selected ? mapModelInfo(result.selected) : null,
    };
  }

  async invoke(payload: ModelInvokeRequest): Promise<ModelInvokeResult> {
    return this.http.request<ModelInvokeResult>({
      method: "POST",
      path: "/api/platform/models/invoke",
      body: {
        prompt: payload.prompt,
        model_id: payload.modelId,
        model: payload.model,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // invokeStream / vision / embed — with Gemini Proxy fallback
  // These methods try the SDK backend first. If the endpoint is not yet
  // implemented (404 / 501 / network error), they fall back to the Gemini
  // Proxy (OpenAI-compatible Cloudflare Worker).
  // ---------------------------------------------------------------------------

  /**
   * Stream a chat completion. Returns an async generator that yields text
   * chunks as they arrive via SSE.
   *
   * Falls back to Gemini Proxy when the SDK backend endpoint
   * POST /api/platform/models/invoke/stream is unavailable.
   */
  async *invokeStream(
    payload: ModelStreamRequest,
  ): AsyncGenerator<string, void, undefined> {
    // --- Attempt 1: SDK backend ---
    try {
      const sdkResult = await this.http.request<{ text: string }>({
        method: "POST",
        path: "/api/platform/models/invoke/stream",
        body: {
          messages: payload.messages,
          model: payload.model,
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
        },
      });
      // If the SDK endpoint returns a plain result (non-streaming), yield it whole
      if (sdkResult && typeof sdkResult.text === "string") {
        yield sdkResult.text;
        return;
      }
    } catch {
      // SDK endpoint not available — fall through to proxy
    }

    // --- Attempt 2: Gemini Proxy (SSE streaming) ---
    const response = await globalThis.fetch(
      `${GEMINI_PROXY_BASE}/v1/chat/completions`,
      {
        method: "POST",
        headers: GEMINI_PROXY_HEADERS,
        body: JSON.stringify({
          model: payload.model ?? GEMINI_DEFAULT_MODEL,
          messages: payload.messages,
          temperature: payload.temperature ?? 0.7,
          max_tokens: payload.max_tokens ?? 4096,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      throw new Error(
        `Gemini Proxy stream request failed (${response.status}): ${errorText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Gemini Proxy returned no readable body for stream");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Multimodal (vision) completion — accepts messages with text and image_url
   * content parts.
   *
   * Falls back to Gemini Proxy when the SDK backend endpoint
   * POST /api/platform/models/vision is unavailable.
   */
  async vision(payload: ModelVisionRequest): Promise<ModelInvokeResult> {
    // --- Attempt 1: SDK backend ---
    try {
      const sdkResult = await this.http.request<ModelInvokeResult>({
        method: "POST",
        path: "/api/platform/models/vision",
        body: {
          messages: payload.messages,
          model: payload.model,
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
        },
      });
      return sdkResult;
    } catch {
      // SDK endpoint not available — fall through to proxy
    }

    // --- Attempt 2: Gemini Proxy ---
    const response = await globalThis.fetch(
      `${GEMINI_PROXY_BASE}/v1/chat/completions`,
      {
        method: "POST",
        headers: GEMINI_PROXY_HEADERS,
        body: JSON.stringify({
          model: payload.model ?? GEMINI_DEFAULT_MODEL,
          messages: payload.messages,
          temperature: payload.temperature ?? 0.7,
          max_tokens: payload.max_tokens ?? 4096,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      throw new Error(
        `Gemini Proxy vision request failed (${response.status}): ${errorText}`,
      );
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };

    const text = json.choices?.[0]?.message?.content ?? "";
    return { text, model: json.model };
  }

  /**
   * Generate text embeddings for one or more input strings.
   *
   * Falls back to Gemini Proxy /v1/embeddings when the SDK
   * backend endpoint POST /api/platform/models/embed is unavailable.
   */
  async embed(payload: ModelEmbedRequest): Promise<ModelEmbedResult> {
    // --- Attempt 1: SDK backend ---
    try {
      const sdkResult = await this.http.request<ModelEmbedResult>({
        method: "POST",
        path: "/api/platform/models/embed",
        body: {
          input: payload.input,
          model: payload.model,
        },
      });
      return sdkResult;
    } catch {
      // SDK endpoint not available — fall through to proxy
    }

    // --- Attempt 2: Gemini Proxy /v1/embeddings ---
    const embeddingModel = payload.model ?? "text-embedding-004";
    const response = await globalThis.fetch(
      `${GEMINI_PROXY_BASE}/v1/embeddings`,
      {
        method: "POST",
        headers: GEMINI_PROXY_HEADERS,
        body: JSON.stringify({
          model: embeddingModel,
          input: payload.input,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      throw new Error(
        `Gemini Proxy embed request failed (${response.status}): ${errorText}`,
      );
    }

    const json = (await response.json()) as {
      data?: { embedding: number[]; index: number }[];
      model?: string;
    };

    const rawEmbeddings = json.data ?? [];
    // Sort by index to guarantee correct ordering
    rawEmbeddings.sort((a, b) => a.index - b.index);
    const embeddings = rawEmbeddings.map((d) => d.embedding);
    const dimensions = embeddings.length > 0 ? embeddings[0].length : 0;

    return {
      embeddings,
      model: json.model ?? embeddingModel,
      dimensions,
    };
  }

  async testProvider(): Promise<never> {
    throw new QeeClawNotImplementedError(
      "models.testProvider() is reserved for a future platform API",
    );
  }

  async getUsage(options: { days?: number } = {}): Promise<ModelUsageSummary> {
    const result = await this.http.request<RawModelUsageSummary>({
      method: "GET",
      path: "/api/platform/models/usage",
      query: options.days ? { days: options.days } : undefined,
    });
    return {
      windowDays: result.window_days,
      periodStart: result.period_start,
      periodEnd: result.period_end,
      attributionMode: result.attribution_mode,
      recordCount: result.record_count,
      totalCalls: result.total_calls,
      totalInputChars: result.total_input_chars,
      totalOutputChars: result.total_output_chars,
      totalDurationSeconds: result.total_duration_seconds,
      lastUsedAt: result.last_used_at,
      breakdown: (result.breakdown ?? []).map(mapUsageBreakdown),
    };
  }

  async getCost(options: { days?: number } = {}): Promise<ModelCostSummary> {
    const result = await this.http.request<RawModelCostSummary>({
      method: "GET",
      path: "/api/platform/models/cost",
      query: options.days ? { days: options.days } : undefined,
    });
    return {
      windowDays: result.window_days,
      periodStart: result.period_start,
      periodEnd: result.period_end,
      attributionMode: result.attribution_mode,
      recordCount: result.record_count,
      totalAmount: result.total_amount,
      primaryCurrency: result.primary_currency,
      currencyBreakdown: (result.currency_breakdown ?? []).map(mapCurrencyAmount),
      lastBilledAt: result.last_billed_at,
      breakdown: (result.breakdown ?? []).map(mapCostBreakdown),
    };
  }

  async getQuota(): Promise<ModelQuotaSummary> {
    const result = await this.http.request<RawModelQuotaSummary>({
      method: "GET",
      path: "/api/platform/models/quota",
    });
    return {
      walletBalance: result.wallet_balance,
      currency: result.currency,
      dailyLimit: result.daily_limit,
      dailySpent: result.daily_spent,
      dailyRemaining: result.daily_remaining,
      dailyUnlimited: result.daily_unlimited,
      monthlyLimit: result.monthly_limit,
      monthlySpent: result.monthly_spent,
      monthlyRemaining: result.monthly_remaining,
      monthlyUnlimited: result.monthly_unlimited,
      updatedTime: result.updated_time,
    };
  }
}
