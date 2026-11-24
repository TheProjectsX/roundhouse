export type RateLimitConfig = {
    rpmLimit?: number | null;
    rpdLimit?: number | null;
    tpmLimit?: number | null;
    tpdLimit?: number | null;
};

type TokenEvent = {
    ts: number;
    tokens: number;
};

type UsageBucket = {
    requestTimestamps: number[];
    tokenEvents: TokenEvent[];
};

type InFlightLease = {
    id: number;
    apiKeysManagerId: string;
    modelId: string;
    estimatedTokens: number;
    createdAt: number;
};

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const LEASE_BACKSTOP_MS = 10 * MINUTE_MS;

const usageBuckets = new Map<string, UsageBucket>();
const activeLeases = new Map<number, InFlightLease>();
let nextLeaseId = 1;

const pacificDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "numeric",
    day: "numeric",
});
const pacificHour = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hourCycle: "h23",
});

export const pacificMidnightMs = (now = Date.now()): number => {
    const parts = pacificDate.formatToParts(now);
    const part = (name: string) =>
        Number(parts.find((p) => p.type === name)?.value ?? "0");
    const candidate = Date.UTC(
        part("year"),
        part("month") - 1,
        part("day"),
        8,
    );
    return candidate - Number(pacificHour.format(candidate)) * 3_600_000;
};

const dailyWindowMs = (providerType: string, now: number): number => {
    if (providerType === "GEMINI") {
        return Math.max(MINUTE_MS, now - pacificMidnightMs(now));
    }
    return DAY_MS;
};

const bucketKey = (apiKeysManagerId: string, modelId: string): string =>
    `${apiKeysManagerId}:${modelId}`;

const getBucket = (key: string): UsageBucket => {
    let bucket = usageBuckets.get(key);
    if (!bucket) {
        bucket = { requestTimestamps: [], tokenEvents: [] };
        usageBuckets.set(key, bucket);
    }
    return bucket;
};

const pruneBucket = (bucket: UsageBucket, now: number): void => {
    const cutoff = now - DAY_MS;
    if (bucket.requestTimestamps.length > 0) {
        bucket.requestTimestamps = bucket.requestTimestamps.filter(
            (ts) => ts > cutoff,
        );
    }
    if (bucket.tokenEvents.length > 0) {
        bucket.tokenEvents = bucket.tokenEvents.filter(
            (event) => event.ts > cutoff,
        );
    }
};

const pruneLeases = (now: number): void => {
    if (activeLeases.size === 0) {
        return;
    }
    for (const [id, lease] of activeLeases) {
        if (now - lease.createdAt > LEASE_BACKSTOP_MS) {
            activeLeases.delete(id);
        }
    }
};

const getInFlightStats = (
    apiKeysManagerId: string,
    modelId: string,
    now: number,
): { requests: number; tokens: number } => {
    pruneLeases(now);
    let requests = 0;
    let tokens = 0;

    for (const lease of activeLeases.values()) {
        if (
            lease.apiKeysManagerId === apiKeysManagerId &&
            lease.modelId === modelId
        ) {
            requests += 1;
            tokens += lease.estimatedTokens;
        }
    }

    return { requests, tokens };
};

export const acquireLease = (
    apiKeysManagerId: string,
    modelId: string,
    estimatedTokens: number,
    now = Date.now(),
): number => {
    pruneLeases(now);
    const id = nextLeaseId++;
    activeLeases.set(id, {
        id,
        apiKeysManagerId,
        modelId,
        estimatedTokens: Math.max(0, estimatedTokens),
        createdAt: now,
    });
    return id;
};

export const releaseLease = (leaseId: number): void => {
    activeLeases.delete(leaseId);
};

export const recordUsage = (
    apiKeysManagerId: string,
    modelId: string,
    tokens: number,
    now = Date.now(),
): void => {
    const bucket = getBucket(bucketKey(apiKeysManagerId, modelId));
    pruneBucket(bucket, now);
    bucket.requestTimestamps.push(now);
    if (tokens > 0) {
        bucket.tokenEvents.push({ ts: now, tokens });
    }
};

export const getWindowUsage = (
    apiKeysManagerId: string,
    modelId: string,
    providerType = "OPENAI",
    now = Date.now(),
): {
    rpm: number;
    rpd: number;
    tpm: number;
    tpd: number;
} => {
    const bucket = usageBuckets.get(bucketKey(apiKeysManagerId, modelId));
    const inFlight = getInFlightStats(apiKeysManagerId, modelId, now);
    const minuteCutoff = now - MINUTE_MS;
    const dayCutoff = now - dailyWindowMs(providerType, now);

    let rpm = inFlight.requests;
    let rpd = inFlight.requests;
    let tpm = inFlight.tokens;
    let tpd = inFlight.tokens;

    if (bucket) {
        pruneBucket(bucket, now);
        for (const ts of bucket.requestTimestamps) {
            if (ts > minuteCutoff) rpm += 1;
            if (ts > dayCutoff) rpd += 1;
        }
        for (const event of bucket.tokenEvents) {
            if (event.ts > minuteCutoff) tpm += event.tokens;
            if (event.ts > dayCutoff) tpd += event.tokens;
        }
    }

    return { rpm, rpd, tpm, tpd };
};

export const canUseCandidateKey = (
    apiKeysManagerId: string,
    modelId: string,
    limits: RateLimitConfig,
    estimatedTokens = 0,
    providerType = "OPENAI",
    now = Date.now(),
): boolean => {
    const hasLimits =
        limits.rpmLimit != null ||
        limits.rpdLimit != null ||
        limits.tpmLimit != null ||
        limits.tpdLimit != null;

    if (!hasLimits) {
        return true;
    }

    const usage = getWindowUsage(apiKeysManagerId, modelId, providerType, now);

    if (
        limits.rpmLimit != null &&
        limits.rpmLimit > 0 &&
        usage.rpm >= limits.rpmLimit
    ) {
        return false;
    }

    if (
        limits.rpdLimit != null &&
        limits.rpdLimit > 0 &&
        usage.rpd >= limits.rpdLimit
    ) {
        return false;
    }

    if (
        limits.tpmLimit != null &&
        limits.tpmLimit > 0 &&
        usage.tpm + estimatedTokens > limits.tpmLimit
    ) {
        return false;
    }

    if (
        limits.tpdLimit != null &&
        limits.tpdLimit > 0 &&
        usage.tpd + estimatedTokens > limits.tpdLimit
    ) {
        return false;
    }

    return true;
};

export const getKeyHeadroomFactor = (
    apiKeysManagerId: string,
    modelId: string,
    limits: RateLimitConfig,
    providerType = "OPENAI",
    now = Date.now(),
): number => {
    const ratios: number[] = [];
    const usage = getWindowUsage(apiKeysManagerId, modelId, providerType, now);

    if (limits.rpmLimit != null && limits.rpmLimit > 0) {
        ratios.push(Math.max(0, 1 - usage.rpm / limits.rpmLimit));
    }
    if (limits.rpdLimit != null && limits.rpdLimit > 0) {
        ratios.push(Math.max(0, 1 - usage.rpd / limits.rpdLimit));
    }
    if (limits.tpmLimit != null && limits.tpmLimit > 0) {
        ratios.push(Math.max(0, 1 - usage.tpm / limits.tpmLimit));
    }
    if (limits.tpdLimit != null && limits.tpdLimit > 0) {
        ratios.push(Math.max(0, 1 - usage.tpd / limits.tpdLimit));
    }

    if (ratios.length === 0) {
        return 1;
    }

    return Math.min(...ratios);
};
