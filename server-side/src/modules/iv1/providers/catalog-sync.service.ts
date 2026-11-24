import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { ContentStatus, ProviderType } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { createDevLogger } from "@/common/utils/logger";
import { isSoftDeleted, notDeletedWhere } from "@/common/utils/softDelete";
import { listProviderModels } from "@/core/models";

type ProviderPreset = {
    code: string;
    name: string;
    description: string;
    baseApi: string;
    type: ProviderType;
    free: boolean;
};

type SyncedModelEntry = {
    code: string;
    name: string;
    contextWindow?: number;
    maxTokens?: number;
    supportsTools?: boolean;
    supportsVision?: boolean;
    thinking?: boolean;
    rpmLimit?: number;
    rpdLimit?: number;
};

const DEFAULT_GLOBAL_PROVIDERS: ProviderPreset[] = [
    {
        code: "openrouter",
        name: "OpenRouter",
        description:
            "Unified gateway with dozens of free community models (:free) and multimodal support.",
        baseApi: "https://openrouter.ai/api/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "groq",
        name: "Groq",
        description:
            "Ultra-fast LPU inference with generous free-tier RPM/RPD quotas.",
        baseApi: "https://api.groq.com/openai/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "cerebras",
        name: "Cerebras",
        description:
            "High-throughput wafer-scale inference with free-tier Llama and Qwen models.",
        baseApi: "https://api.cerebras.ai/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "gemini",
        name: "Google Gemini",
        description:
            "Google AI Studio Gemini models with free-tier daily quotas.",
        baseApi: "https://generativelanguage.googleapis.com/v1beta",
        type: ProviderType.GEMINI,
        free: true,
    },
    {
        code: "nvidia",
        name: "NVIDIA NIM",
        description:
            "NVIDIA hosted open-weight frontier models with free 40 RPM tier.",
        baseApi: "https://integrate.api.nvidia.com/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "mistral",
        name: "Mistral AI",
        description:
            "Mistral and Codestral models with free Experiment tier.",
        baseApi: "https://api.mistral.ai/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "huggingface",
        name: "HuggingFace Router",
        description:
            "Open-source models served via HuggingFace Inference Providers.",
        baseApi: "https://router.huggingface.co/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "ollama",
        name: "Ollama Cloud",
        description:
            "Cloud-hosted open-weight models via Ollama's OpenAI-compatible API.",
        baseApi: "https://ollama.com/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "opencode",
        name: "OpenCode Zen",
        description:
            "OpenCode inference gateway with free and frontier coding models.",
        baseApi: "https://opencode.ai/inference/openai/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "sambanova",
        name: "SambaNova",
        description:
            "High-speed SambaNova Cloud inference with free-tier Llama and Qwen models.",
        baseApi: "https://api.sambanova.ai/v1",
        type: ProviderType.OPENAI,
        free: true,
    },
    {
        code: "deepseek",
        name: "DeepSeek",
        description:
            "DeepSeek V3 and R1 reasoning models via OpenAI-compatible API.",
        baseApi: "https://api.deepseek.com/v1",
        type: ProviderType.OPENAI,
        free: false,
    },
    {
        code: "openai",
        name: "OpenAI",
        description: "Official OpenAI GPT and o-series models.",
        baseApi: "https://api.openai.com/v1",
        type: ProviderType.OPENAI,
        free: false,
    },
    {
        code: "anthropic",
        name: "Anthropic",
        description: "Official Anthropic Claude models.",
        baseApi: "https://api.anthropic.com",
        type: ProviderType.ANTHROPIC,
        free: false,
    },
];

const LITELLM_CATALOG_URL =
    "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const MODELS_DEV_CATALOG_URL = "https://models.dev/api.json";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const PUBLIC_OPENAI_MODELS_URLS: Record<string, string> = {
    huggingface: "https://router.huggingface.co/v1/models",
    nvidia: "https://integrate.api.nvidia.com/v1/models",
};
const MODELS_DEV_PROVIDER_MAP: Record<string, string> = {
    groq: "groq",
    cerebras: "cerebras",
    gemini: "google",
    nvidia: "nvidia",
    mistral: "mistral",
    huggingface: "huggingface",
    ollama: "ollama-cloud",
    opencode: "opencode",
    sambanova: "sambanova",
    deepseek: "deepseek",
    openai: "openai",
    anthropic: "anthropic",
};
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const BOOT_SYNC_DELAY_MS = 5 * 1000;

const LITELLM_PROVIDER_PREFIXES: Record<string, string[]> = {
    groq: ["groq/"],
    cerebras: ["cerebras/"],
    gemini: ["gemini/"],
    mistral: ["mistral/"],
    deepseek: ["deepseek/"],
    openai: ["gpt-", "o1", "o3", "o4"],
    anthropic: ["claude-"],
};

@Injectable()
export class CatalogSyncService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = createDevLogger("catalog.sync");
    private bootTimer: NodeJS.Timeout | null = null;
    private intervalTimer: NodeJS.Timeout | null = null;
    private syncing = false;
    private lastSyncedAt: Date | null = null;
    private lastSummary: {
        createdCount: number;
        updatedCount: number;
        deprecatedCount: number;
        providersSynced: number;
    } | null = null;

    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        await this.bootstrapDefaultProviders().catch((err) => {
            this.logger.warn("Provider bootstrap failed", {
                error: err instanceof Error ? err.message : "Unknown error",
            });
        });

        this.bootTimer = setTimeout(() => {
            void this.syncAllCatalogs().catch(() => undefined);
        }, BOOT_SYNC_DELAY_MS);
        this.bootTimer.unref();

        this.intervalTimer = setInterval(() => {
            void this.syncAllCatalogs().catch(() => undefined);
        }, SYNC_INTERVAL_MS);
        this.intervalTimer.unref();
    }

    onModuleDestroy() {
        if (this.bootTimer) {
            clearTimeout(this.bootTimer);
            this.bootTimer = null;
        }
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }

    getStatus() {
        return {
            syncing: this.syncing,
            lastSyncedAt: this.lastSyncedAt,
            syncIntervalHours: SYNC_INTERVAL_MS / (60 * 60 * 1000),
            lastSummary: this.lastSummary,
        };
    }

    async bootstrapDefaultProviders() {
        for (const preset of DEFAULT_GLOBAL_PROVIDERS) {
            const existing = await this.prisma.provider.findUnique({
                where: { code: preset.code },
                select: { id: true },
            });

            if (!existing) {
                await this.prisma.provider.create({
                    data: {
                        name: preset.name,
                        code: preset.code,
                        description: preset.description,
                        baseApi: preset.baseApi,
                        type: preset.type,
                        free: preset.free,
                        status: ContentStatus.ACTIVE,
                    },
                });
            }
        }
    }

    private async fetchOpenRouterModels(): Promise<SyncedModelEntry[]> {
        const res = await fetch(OPENROUTER_MODELS_URL);
        if (!res.ok) {
            return [];
        }

        const payload = (await res.json()) as {
            data?: Array<{
                id?: string;
                name?: string;
                context_length?: number;
                top_provider?: { max_completion_tokens?: number | null };
                pricing?: { prompt?: string; completion?: string };
                supported_parameters?: string[];
                architecture?: {
                    input_modalities?: string[];
                    modality?: string;
                };
            }>;
        };

        const rows = Array.isArray(payload.data) ? payload.data : [];
        return rows
            .filter((row) => {
                if (!row.id) return false;
                const isFreeId = row.id.endsWith(":free");
                const isZeroPrice =
                    row.pricing?.prompt === "0" &&
                    row.pricing?.completion === "0";
                return isFreeId || isZeroPrice;
            })
            .map((row) => {
                const inputModalities =
                    row.architecture?.input_modalities ?? [];
                const modalityStr = row.architecture?.modality ?? "";
                const supportsVision =
                    inputModalities.includes("image") ||
                    modalityStr.includes("image");
                const supportsTools = Array.isArray(row.supported_parameters)
                    ? row.supported_parameters.includes("tools")
                    : undefined;

                return {
                    code: row.id!,
                    name: row.name || row.id!,
                    contextWindow:
                        typeof row.context_length === "number" &&
                        row.context_length > 0
                            ? row.context_length
                            : undefined,
                    maxTokens:
                        typeof row.top_provider?.max_completion_tokens ===
                            "number" &&
                        row.top_provider.max_completion_tokens > 0
                            ? row.top_provider.max_completion_tokens
                            : undefined,
                    supportsTools,
                    supportsVision,
                };
            });
    }

    private async fetchLiteLlmCatalog(): Promise<
        Map<string, SyncedModelEntry[]>
    > {
        const byProvider = new Map<string, SyncedModelEntry[]>();
        const res = await fetch(LITELLM_CATALOG_URL);
        if (!res.ok) {
            return byProvider;
        }

        const data = (await res.json()) as Record<
            string,
            {
                mode?: string;
                max_input_tokens?: number;
                max_output_tokens?: number;
                max_tokens?: number;
                supports_function_calling?: boolean;
                supports_vision?: boolean;
            }
        >;

        for (const [rawKey, meta] of Object.entries(data)) {
            if (!meta || typeof meta !== "object") continue;
            if (meta.mode && meta.mode !== "chat") continue;

            for (const [providerCode, prefixes] of Object.entries(
                LITELLM_PROVIDER_PREFIXES,
            )) {
                const matchedPrefix = prefixes.find((p) =>
                    rawKey.startsWith(p),
                );
                if (!matchedPrefix) continue;

                const modelCode = matchedPrefix.endsWith("/")
                    ? rawKey.slice(matchedPrefix.length)
                    : rawKey;

                if (!modelCode || modelCode.includes("*")) continue;

                const list = byProvider.get(providerCode) ?? [];
                list.push({
                    code: modelCode,
                    name: modelCode,
                    contextWindow:
                        typeof meta.max_input_tokens === "number" &&
                        meta.max_input_tokens > 0
                            ? meta.max_input_tokens
                            : undefined,
                    maxTokens:
                        typeof meta.max_output_tokens === "number" &&
                        meta.max_output_tokens > 0
                            ? meta.max_output_tokens
                            : typeof meta.max_tokens === "number" &&
                                meta.max_tokens > 0
                              ? meta.max_tokens
                              : undefined,
                    supportsTools:
                        typeof meta.supports_function_calling === "boolean"
                            ? meta.supports_function_calling
                            : undefined,
                    supportsVision:
                        typeof meta.supports_vision === "boolean"
                            ? meta.supports_vision
                            : undefined,
                });
                byProvider.set(providerCode, list);
                break;
            }
        }

        return byProvider;
    }

    private async fetchModelsDevCatalog(): Promise<
        Map<string, SyncedModelEntry[]>
    > {
        const byProvider = new Map<string, SyncedModelEntry[]>();
        const res = await fetch(MODELS_DEV_CATALOG_URL);
        if (!res.ok) {
            return byProvider;
        }

        const data = (await res.json()) as Record<
            string,
            {
                models?: Record<
                    string,
                    {
                        id?: string;
                        name?: string;
                        status?: string;
                        reasoning?: boolean;
                        tool_call?: boolean;
                        modalities?: {
                            input?: string[];
                            output?: string[];
                        };
                        limit?: {
                            context?: number;
                            output?: number;
                        };
                    }
                >;
            }
        >;

        for (const [providerCode, modelsDevKey] of Object.entries(
            MODELS_DEV_PROVIDER_MAP,
        )) {
            const rawModels = data[modelsDevKey]?.models;
            if (!rawModels || typeof rawModels !== "object") continue;

            const entries: SyncedModelEntry[] = [];
            for (const [modelKey, meta] of Object.entries(rawModels)) {
                if (!meta || typeof meta !== "object") continue;
                if (meta.status === "deprecated") continue;

                const outputModalities = meta.modalities?.output;
                if (
                    Array.isArray(outputModalities) &&
                    outputModalities.length > 0 &&
                    !outputModalities.includes("text")
                ) {
                    continue;
                }

                const code = meta.id || modelKey;
                if (!code) continue;

                const inputModalities = meta.modalities?.input ?? [];
                entries.push({
                    code,
                    name: meta.name || code,
                    contextWindow:
                        typeof meta.limit?.context === "number" &&
                        meta.limit.context > 0
                            ? meta.limit.context
                            : undefined,
                    maxTokens:
                        typeof meta.limit?.output === "number" &&
                        meta.limit.output > 0
                            ? meta.limit.output
                            : undefined,
                    supportsTools:
                        typeof meta.tool_call === "boolean"
                            ? meta.tool_call
                            : undefined,
                    supportsVision: Array.isArray(meta.modalities?.input)
                        ? inputModalities.includes("image")
                        : undefined,
                    thinking:
                        typeof meta.reasoning === "boolean"
                            ? meta.reasoning
                            : undefined,
                });
            }

            if (entries.length > 0) {
                byProvider.set(providerCode, entries);
            }
        }

        return byProvider;
    }

    private async fetchPublicOpenAiModels(
        url: string,
    ): Promise<SyncedModelEntry[]> {
        const res = await fetch(url);
        if (!res.ok) {
            return [];
        }

        const payload = (await res.json()) as {
            data?: Array<{ id?: string }>;
        };
        const rows = Array.isArray(payload.data) ? payload.data : [];

        return rows
            .filter((row): row is { id: string } => Boolean(row?.id))
            .map((row) => ({
                code: row.id,
                name: row.id,
            }));
    }

    private mergeEntries(
        primary: SyncedModelEntry[],
        secondary: SyncedModelEntry[],
    ): SyncedModelEntry[] {
        const merged = new Map<string, SyncedModelEntry>();

        for (const item of secondary) {
            merged.set(item.code, item);
        }

        for (const item of primary) {
            const fallback = merged.get(item.code);
            if (!fallback) {
                merged.set(item.code, item);
                continue;
            }
            merged.set(item.code, {
                code: item.code,
                name:
                    item.name && item.name !== item.code
                        ? item.name
                        : fallback.name,
                contextWindow: item.contextWindow ?? fallback.contextWindow,
                maxTokens: item.maxTokens ?? fallback.maxTokens,
                supportsTools: item.supportsTools ?? fallback.supportsTools,
                supportsVision: item.supportsVision ?? fallback.supportsVision,
                thinking: item.thinking ?? fallback.thinking,
                rpmLimit: item.rpmLimit ?? fallback.rpmLimit,
                rpdLimit: item.rpdLimit ?? fallback.rpdLimit,
            });
        }

        return Array.from(merged.values());
    }

    private async upsertProviderModels(
        providerCode: string,
        entries: SyncedModelEntry[],
        retireMissing: boolean,
    ) {
        let createdCount = 0;
        let updatedCount = 0;
        let deprecatedCount = 0;

        const seenCodes = new Set<string>();

        for (const entry of entries) {
            if (seenCodes.has(entry.code)) continue;
            seenCodes.add(entry.code);

            const existing = await this.prisma.model.findUnique({
                where: {
                    code_provider: {
                        code: entry.code,
                        provider: providerCode,
                    },
                },
                select: { id: true, status: true, deletedAt: true },
            });

            if (existing) {
                if (isSoftDeleted(existing)) {
                    continue;
                }
                await this.prisma.model.update({
                    where: { id: existing.id },
                    data: {
                        name: entry.name,
                        status:
                            existing.status === ContentStatus.DEPRECATED
                                ? ContentStatus.ACTIVE
                                : existing.status,
                        ...(entry.contextWindow !== undefined
                            ? { contextWindow: entry.contextWindow }
                            : {}),
                        ...(entry.maxTokens !== undefined
                            ? { maxTokens: entry.maxTokens }
                            : {}),
                        ...(entry.supportsTools !== undefined
                            ? { supportsTools: entry.supportsTools }
                            : {}),
                        ...(entry.supportsVision !== undefined
                            ? { supportsVision: entry.supportsVision }
                            : {}),
                        ...(entry.thinking !== undefined
                            ? { thinking: entry.thinking }
                            : {}),
                    },
                });
                updatedCount += 1;
            } else {
                await this.prisma.model.create({
                    data: {
                        name: entry.name,
                        code: entry.code,
                        provider: providerCode,
                        contextWindow: entry.contextWindow,
                        maxTokens: entry.maxTokens,
                        supportsTools: entry.supportsTools,
                        supportsVision: entry.supportsVision,
                        thinking: entry.thinking ?? false,
                        rpmLimit: entry.rpmLimit,
                        rpdLimit: entry.rpdLimit,
                        status: ContentStatus.ACTIVE,
                    },
                });
                createdCount += 1;
            }
        }

        if (retireMissing && seenCodes.size > 0) {
            const stale = await this.prisma.model.findMany({
                where: {
                    provider: providerCode,
                    status: ContentStatus.ACTIVE,
                    code: { notIn: Array.from(seenCodes) },
                    AND: [notDeletedWhere()],
                },
                select: { id: true },
            });

            if (stale.length > 0) {
                await this.prisma.model.updateMany({
                    where: { id: { in: stale.map((s) => s.id) } },
                    data: { status: ContentStatus.DEPRECATED },
                });
                deprecatedCount += stale.length;
            }
        }

        return { createdCount, updatedCount, deprecatedCount };
    }

    async syncAllCatalogs() {
        if (this.syncing) {
            return this.getStatus();
        }

        this.syncing = true;
        let createdCount = 0;
        let updatedCount = 0;
        let deprecatedCount = 0;
        let providersSynced = 0;

        try {
            await this.bootstrapDefaultProviders();
            const providers = await this.prisma.provider.findMany({
                where: {
                    status: ContentStatus.ACTIVE,
                    AND: [notDeletedWhere()],
                },
            });

            const [liteLlmByProvider, modelsDevByProvider] = await Promise.all([
                this.fetchLiteLlmCatalog().catch(
                    () => new Map<string, SyncedModelEntry[]>(),
                ),
                this.fetchModelsDevCatalog().catch(
                    () => new Map<string, SyncedModelEntry[]>(),
                ),
            ]);

            for (const provider of providers) {
                const code = provider.code.toLowerCase();
                let entries: SyncedModelEntry[] = [];
                let authoritative = false;

                const modelsDevEntries = modelsDevByProvider.get(code) ?? [];
                const liteLlmEntries = liteLlmByProvider.get(code) ?? [];
                const combinedMetadata = this.mergeEntries(
                    modelsDevEntries,
                    liteLlmEntries,
                );

                if (code === "openrouter") {
                    entries = await this.fetchOpenRouterModels().catch(
                        () => [],
                    );
                    authoritative = entries.length > 0;
                } else {
                    const systemKey =
                        process.env[`SYSTEM_SYNC_KEY_${code.toUpperCase()}`];
                    if (systemKey) {
                        const liveModels = await listProviderModels(
                            provider.type,
                            {
                                baseApi: provider.baseApi,
                                apiKey: systemKey,
                                headers: {},
                                request: {
                                    model: "gpt-4o-mini",
                                    messages: [],
                                    stream: false,
                                    params: {},
                                    rawBody: {},
                                },
                            },
                        ).catch(() => []);

                        if (liveModels.length > 0) {
                            const metaMap = new Map(
                                combinedMetadata.map((m) => [m.code, m]),
                            );
                            entries = liveModels.map((m) => ({
                                ...(metaMap.get(m.id) ?? {}),
                                code: m.id,
                                name: metaMap.get(m.id)?.name || m.id,
                            }));
                            authoritative = true;
                        }
                    }

                    if (entries.length === 0 && PUBLIC_OPENAI_MODELS_URLS[code]) {
                        const publicLive = await this.fetchPublicOpenAiModels(
                            PUBLIC_OPENAI_MODELS_URLS[code],
                        ).catch(() => []);
                        if (publicLive.length > 0) {
                            const metaMap = new Map(
                                combinedMetadata.map((m) => [m.code, m]),
                            );
                            entries = publicLive.map((m) => ({
                                ...(metaMap.get(m.code) ?? {}),
                                code: m.code,
                                name: metaMap.get(m.code)?.name || m.name,
                            }));
                            authoritative = true;
                        }
                    }

                    if (entries.length === 0) {
                        entries = combinedMetadata;
                    }
                }

                if (entries.length > 0) {
                    const counts = await this.upsertProviderModels(
                        provider.code,
                        entries,
                        authoritative,
                    );
                    createdCount += counts.createdCount;
                    updatedCount += counts.updatedCount;
                    deprecatedCount += counts.deprecatedCount;
                    providersSynced += 1;
                }
            }

            this.lastSyncedAt = new Date();
            this.lastSummary = {
                createdCount,
                updatedCount,
                deprecatedCount,
                providersSynced,
            };

            this.logger.log("Catalog sync completed", this.lastSummary);
        } finally {
            this.syncing = false;
        }

        return this.getStatus();
    }
}
