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
    strategy?: "random" | "efficiency";
} => {
    const rawProviders = normalizeHeaderValue(headers["x-providers"]);
    const providerTokens = rawProviders
        ? rawProviders
              .split(",")
              .map((part) => part.trim().toLowerCase())
              .filter(Boolean)
        : [];

    const rawModels = normalizeHeaderValue(headers["x-models"]);
    const modelTokensFromHeader = rawModels
        ? rawModels
              .split(",")
              .map((part) => part.trim().toLowerCase())
              .filter(Boolean)
        : [];
    const mergedTokens = [...providerTokens, ...modelTokensFromHeader];
    const modelKeys = mergedTokens.length ? new Set(mergedTokens) : undefined;

    // Keep provider field only for backward compatibility/fast path.
    // Main filtering semantics are driven by `modelKeys`.
    const providersFromModels = new Set(
        mergedTokens.map((token) => token.split("/")[0]).filter(Boolean),
    );
    const providerFromModels =
        providersFromModels.size === 1
            ? [...providersFromModels][0].toUpperCase()
            : undefined;

    const rawIterations = normalizeHeaderValue(headers["x-max-iterations"]);
    const parsedIterations = rawIterations ? Number(rawIterations) : NaN;
    const maxIterations =
        Number.isFinite(parsedIterations) && parsedIterations > 0
            ? Math.floor(parsedIterations)
            : undefined;
    const rawRoundhouseType = normalizeHeaderValue(headers["x-roundhouse-type"])
        ?.trim()
        .toLowerCase();
    const strategy = rawRoundhouseType === "random" ? "random" : "efficiency";

    return {
        provider:
            providerFromModels === "OPENAI" ||
            providerFromModels === "ANTHROPIC" ||
            providerFromModels === "GEMINI" ||
            providerFromModels === "CUSTOM"
                ? providerFromModels
                : undefined,
        modelKeys,
        maxIterations,
        strategy,
    };
};
