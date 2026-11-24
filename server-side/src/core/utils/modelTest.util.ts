import { ProviderType } from "@prisma/client";
import { callProviderChatCompletion } from "@/core/models";
import { decryptVaultKey } from "@/common/utils/vault-crypto";

export interface ModelTestResult {
    success: boolean;
    provider: {
        id: string;
        name: string;
        code: string;
    };
    model: {
        id: string;
        name: string;
        code: string;
    };
    vaultKey: {
        id: string;
        name: string;
    };
    latencyMs: number;
    reply?: string;
    error?: string;
}

const DEFAULT_BASE_APIS: Record<Exclude<ProviderType, "CUSTOM">, string> = {
    OPENAI: "https://api.openai.com/v1",
    ANTHROPIC: "https://api.anthropic.com",
    GEMINI: "https://generativelanguage.googleapis.com/v1beta",
};

export async function executeModelTest(params: {
    provider: {
        id: string;
        name: string;
        code: string;
        type: ProviderType;
        baseApi: string;
    };
    model: {
        id: string;
        name: string;
        code: string;
    };
    vaultKey: {
        id: string;
        name: string;
        key: string;
    };
}): Promise<ModelTestResult> {
    const { provider, model, vaultKey } = params;
    let baseApi = provider.baseApi?.trim() || "";
    if (!baseApi && provider.type !== ProviderType.CUSTOM) {
        baseApi = DEFAULT_BASE_APIS[provider.type];
    }
    if (provider.type === ProviderType.CUSTOM && baseApi) {
        baseApi = baseApi
            .replace(/\/+$/, "")
            .replace(/\/(chat\/completions|responses)$/i, "");
    }

    const apiKey = decryptVaultKey(vaultKey.key);
    const startedAt = Date.now();

    try {
        const response = await callProviderChatCompletion(provider.type, {
            baseApi,
            apiKey,
            headers: {},
            request: {
                model: model.code,
                messages: [{ role: "user", content: "Reply with OK." }],
                stream: false,
                params: { max_tokens: 16 },
                rawBody: {},
            },
        });

        return {
            success: true,
            provider: {
                id: provider.id,
                name: provider.name,
                code: provider.code,
            },
            model: {
                id: model.id,
                name: model.name,
                code: model.code,
            },
            vaultKey: {
                id: vaultKey.id,
                name: vaultKey.name,
            },
            latencyMs: Date.now() - startedAt,
            reply: response.content?.trim().slice(0, 200) || "OK",
        };
    } catch (error) {
        return {
            success: false,
            provider: {
                id: provider.id,
                name: provider.name,
                code: provider.code,
            },
            model: {
                id: model.id,
                name: model.name,
                code: model.code,
            },
            vaultKey: {
                id: vaultKey.id,
                name: vaultKey.name,
            },
            latencyMs: Date.now() - startedAt,
            error:
                error instanceof Error
                    ? error.message
                    : "Model test request failed",
        };
    }
}
