import { getKeyHeadroomFactor, type RateLimitConfig } from "./ratelimit.util";

export type BanditWeights = {
    reliability: number;
    speed: number;
    intelligence: number;
};

export const DEFAULT_BANDIT_WEIGHTS: BanditWeights = {
    reliability: 0.5,
    speed: 0.25,
    intelligence: 0.25,
};

const LATENCY_CAP_MS = 15_000;
const DEFAULT_SPEED_SCORE = 0.65;
const HEADROOM_RAMP_START = 0.25;
const HEADROOM_FLOOR = 0.2;
const PRIOR_ALPHA = 2;
const PRIOR_BETA = 0.5;

const latencyEwmaMs = new Map<string, number>();

export const recordModelLatency = (modelId: string, latencyMs: number): void => {
    if (!Number.isFinite(latencyMs) || latencyMs < 0) {
        return;
    }

    const clamped = Math.min(latencyMs, LATENCY_CAP_MS);
    const prev = latencyEwmaMs.get(modelId);
    const next = prev === undefined ? clamped : prev * 0.7 + clamped * 0.3;
    latencyEwmaMs.set(modelId, next);
};

export const getSpeedScore = (modelId: string): number => {
    const avgMs = latencyEwmaMs.get(modelId);
    if (avgMs === undefined) {
        return DEFAULT_SPEED_SCORE;
    }

    return Math.max(0.05, Math.min(1, 1 - avgMs / LATENCY_CAP_MS));
};

// Marsaglia & Tsang gamma sampler for Thompson sampling on Beta(alpha, beta).
const sampleGamma = (shape: number): number => {
    if (shape < 1) {
        return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        let x = 0;
        let v = 0;
        do {
            const u1 = Math.max(1e-12, Math.random());
            const u2 = Math.random();
            x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();
        if (u < 1 - 0.0331 * x * x * x * x) {
            return d * v;
        }
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v;
        }
    }
};

export const sampleReliability = (
    successCount: number,
    failureCount: number,
): number => {
    const alpha = PRIOR_ALPHA + Math.max(0, successCount);
    const beta = PRIOR_BETA + Math.max(0, failureCount);
    const g1 = sampleGamma(alpha);
    const g2 = sampleGamma(beta);
    if (g1 + g2 === 0) {
        return 0.5;
    }
    return g1 / (g1 + g2);
};

export const computeHeadroomMultiplier = (headroom: number): number => {
    if (headroom >= HEADROOM_RAMP_START) {
        return 1;
    }
    const ratio = Math.max(0, headroom) / HEADROOM_RAMP_START;
    return HEADROOM_FLOOR + (1 - HEADROOM_FLOOR) * ratio;
};

export const computeBanditScore = (params: {
    modelId: string;
    efficiencyScore: number | null;
    successCount: number;
    failureCount: number;
    apiKeysManagerIds: string[];
    limits: RateLimitConfig;
    providerType: string;
    weights?: BanditWeights;
    now?: number;
}): number => {
    const weights = params.weights ?? DEFAULT_BANDIT_WEIGHTS;
    const reliability = sampleReliability(
        params.successCount,
        params.failureCount,
    );
    const speed = getSpeedScore(params.modelId);
    const intelligence = Math.max(
        0,
        Math.min(1, params.efficiencyScore ?? 0.5),
    );

    const base =
        weights.reliability * reliability +
        weights.speed * speed +
        weights.intelligence * intelligence;

    let bestHeadroom = 1;
    if (params.apiKeysManagerIds.length > 0) {
        bestHeadroom = Math.max(
            ...params.apiKeysManagerIds.map((keyId) =>
                getKeyHeadroomFactor(
                    keyId,
                    params.modelId,
                    params.limits,
                    params.providerType,
                    params.now,
                ),
            ),
        );
    }

    return base * computeHeadroomMultiplier(bestHeadroom);
};
