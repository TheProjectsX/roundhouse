export type HeadersLike = Record<string, string | string[] | undefined>;

export type RequestLike = {
    headers: HeadersLike;
    query?: Record<string, unknown>;
};

const normalizeHeaderValue = (
    value: string | string[] | undefined,
): string | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

export const readAuthorizationBearer = (
    authorization: string | undefined,
): string | undefined => {
    if (!authorization) {
        return undefined;
    }

    return authorization.replace(/^Bearer\s+/i, "").trim() || undefined;
};

export const resolveApiKey = (
    req: RequestLike,
    options?: { allowQueryApiKey?: boolean },
): string | undefined => {
    const headerApiKey = normalizeHeaderValue(req.headers["x-api-key"]);
    const bearerApiKey = readAuthorizationBearer(
        normalizeHeaderValue(req.headers.authorization),
    );

    if (headerApiKey) {
        return headerApiKey;
    }

    if (bearerApiKey) {
        return bearerApiKey;
    }

    if (options?.allowQueryApiKey) {
        const queryApiKey = req.query?.apiKey;

        if (typeof queryApiKey === "string" && queryApiKey.trim()) {
            return queryApiKey.trim();
        }
    }

    return undefined;
};

export const resolveRoundhouseFilters = (
    headers: HeadersLike,
): {
    provider?: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
    modelKeys?: Set<string>;
    maxIterations?: number;
} => {
    const rawProvider = normalizeHeaderValue(headers["x-provider"]);
    const provider = rawProvider?.trim().toUpperCase();
    const providerFilter =
        provider === "OPENAI" ||
        provider === "ANTHROPIC" ||
        provider === "GEMINI" ||
        provider === "CUSTOM"
            ? provider
            : undefined;

    const rawModels = normalizeHeaderValue(headers["x-models"]);
    const modelKeys = rawModels
        ? new Set(
              rawModels
                  .split(",")
                  .map((part) => part.trim().toLowerCase())
                  .filter(Boolean),
          )
        : undefined;

    const rawIterations = normalizeHeaderValue(headers["x-max-iterations"]);
    const parsedIterations = rawIterations ? Number(rawIterations) : NaN;
    const maxIterations =
        Number.isFinite(parsedIterations) && parsedIterations > 0
            ? Math.floor(parsedIterations)
            : undefined;

    return {
        provider: providerFilter,
        modelKeys,
        maxIterations,
    };
};
