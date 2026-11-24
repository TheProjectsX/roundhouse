export type ProviderErrorCategory =
    | "rate_limit"
    | "auth_or_billing"
    | "model_unavailable"
    | "provider_down"
    | "context_too_large"
    | "bad_request"
    | "transient";

export type CooldownScope =
    | "key_model"
    | "key_provider"
    | "model"
    | "request_provider"
    | "none";

export type ClassifiedProviderError = {
    category: ProviderErrorCategory;
    cooldownScope: CooldownScope;
    cooldownMs: number;
    retryable: boolean;
    status: number;
    message: string;
};

export class ProviderHttpError extends Error {
    readonly status: number;
    readonly retryAfterMs?: number;

    constructor(message: string, status: number, retryAfterMs?: number) {
        super(message);
        this.name = "ProviderHttpError";
        this.status = status;
        this.retryAfterMs = retryAfterMs;
    }
}

const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_DEFAULT_MS = 60 * 1000;
const AUTH_BILLING_COOLDOWN_MS = 15 * 60 * 1000;
const MODEL_UNAVAILABLE_COOLDOWN_MS = 10 * 60 * 1000;
const PROVIDER_DOWN_COOLDOWN_MS = 30 * 1000;
const CONTEXT_TOO_LARGE_COOLDOWN_MS = 5 * 1000;

const TRANSPORT_CAUSE_MAX_DEPTH = 5;
const TRANSPORT_ERROR_CODES = new Set([
    "ECONNRESET",
    "ECONNREFUSED",
    "ECONNABORTED",
    "EPIPE",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EADDRNOTAVAIL",
]);

export const parseRetryAfterMs = (
    headerValue: string | null | undefined,
    now = Date.now(),
): number | undefined => {
    if (!headerValue) {
        return undefined;
    }

    const trimmed = headerValue.trim();
    if (!trimmed) {
        return undefined;
    }

    const seconds = Number(trimmed);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(Math.round(seconds * 1000), MAX_RETRY_AFTER_MS);
    }

    const parsedDate = Date.parse(trimmed);
    if (Number.isFinite(parsedDate)) {
        const delta = parsedDate - now;
        if (delta > 0) {
            return Math.min(delta, MAX_RETRY_AFTER_MS);
        }
    }

    return undefined;
};

export const createProviderHttpError = (
    response: Pick<Response, "status" | "headers">,
    message: string,
): ProviderHttpError => {
    const retryAfterMs = parseRetryAfterMs(response.headers?.get?.("retry-after"));
    return new ProviderHttpError(message, response.status, retryAfterMs);
};

const hasTransportCause = (error: unknown): boolean => {
    const seen = new Set<unknown>();
    let current: unknown = error;

    for (
        let depth = 0;
        current != null && depth <= TRANSPORT_CAUSE_MAX_DEPTH;
        depth += 1
    ) {
        if (typeof current !== "object" && typeof current !== "function") {
            break;
        }
        if (seen.has(current)) {
            break;
        }
        seen.add(current);

        const record = current as {
            code?: unknown;
            message?: unknown;
            cause?: unknown;
        };

        if (typeof record.code === "string") {
            if (
                TRANSPORT_ERROR_CODES.has(record.code) ||
                record.code.startsWith("UND_ERR_")
            ) {
                return true;
            }
        }

        if (typeof record.message === "string") {
            const msg = record.message.toLowerCase();
            if (
                msg.includes("socket hang up") ||
                msg.includes("premature close") ||
                msg.includes("other side closed") ||
                msg.includes("fetch failed") ||
                msg.includes("etimedout") ||
                msg.includes("econnreset") ||
                msg.includes("econnrefused")
            ) {
                return true;
            }
        }

        current = record.cause;
    }

    return false;
};

const extractStatus = (error: unknown): number => {
    if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === "number" && Number.isFinite(status)) {
            return status;
        }
    }

    return 0;
};

const extractRetryAfterMs = (error: unknown): number | undefined => {
    if (error && typeof error === "object" && "retryAfterMs" in error) {
        const retryAfterMs = (error as { retryAfterMs?: unknown }).retryAfterMs;
        if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
            return retryAfterMs;
        }
    }

    return undefined;
};

export const classifyProviderError = (
    error: unknown,
): ClassifiedProviderError => {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Unknown upstream error";
    const lower = message.toLowerCase();
    const status = extractStatus(error);
    const retryAfterMs = extractRetryAfterMs(error);

    if (
        status === 429 ||
        lower.includes("rate limit") ||
        lower.includes("too many requests") ||
        lower.includes("resource_exhausted") ||
        lower.includes("quota")
    ) {
        return {
            category: "rate_limit",
            cooldownScope: "key_model",
            cooldownMs: retryAfterMs ?? RATE_LIMIT_DEFAULT_MS,
            retryable: true,
            status: status || 429,
            message,
        };
    }

    if (
        status === 401 ||
        status === 402 ||
        status === 403 ||
        lower.includes("invalid api key") ||
        lower.includes("unauthorized") ||
        lower.includes("payment required") ||
        lower.includes("insufficient_quota") ||
        lower.includes("account suspended")
    ) {
        return {
            category: "auth_or_billing",
            cooldownScope: "key_provider",
            cooldownMs: AUTH_BILLING_COOLDOWN_MS,
            retryable: true,
            status: status || 401,
            message,
        };
    }

    if (
        status === 404 ||
        status === 410 ||
        lower.includes("not found") ||
        lower.includes("no endpoints found") ||
        lower.includes("model_not_found")
    ) {
        return {
            category: "model_unavailable",
            cooldownScope: "model",
            cooldownMs: MODEL_UNAVAILABLE_COOLDOWN_MS,
            retryable: true,
            status: status || 404,
            message,
        };
    }

    if (
        status === 413 ||
        lower.includes("context length") ||
        lower.includes("maximum context") ||
        lower.includes("prompt is too long") ||
        lower.includes("payload too large") ||
        lower.includes("request entity too large") ||
        lower.includes("token count")
    ) {
        return {
            category: "context_too_large",
            cooldownScope: "model",
            cooldownMs: CONTEXT_TOO_LARGE_COOLDOWN_MS,
            retryable: true,
            status: status || 413,
            message,
        };
    }

    if (status === 400 || status === 422) {
        return {
            category: "bad_request",
            cooldownScope: "model",
            cooldownMs: CONTEXT_TOO_LARGE_COOLDOWN_MS,
            retryable: true,
            status,
            message,
        };
    }

    if (
        status >= 500 ||
        status === 408 ||
        hasTransportCause(error) ||
        lower.includes("timeout") ||
        lower.includes("unavailable") ||
        lower.includes("internal server error") ||
        lower.includes("overloaded")
    ) {
        return {
            category: "provider_down",
            cooldownScope: "request_provider",
            cooldownMs: PROVIDER_DOWN_COOLDOWN_MS,
            retryable: true,
            status: status || 502,
            message,
        };
    }

    return {
        category: "transient",
        cooldownScope: "key_model",
        cooldownMs: PROVIDER_DOWN_COOLDOWN_MS,
        retryable: true,
        status: status || 502,
        message,
    };
};
