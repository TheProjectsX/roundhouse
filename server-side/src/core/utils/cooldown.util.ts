type CooldownEntry = {
    expiresAt: number;
    reason: string;
};

export const MODEL_FAILURE_WINDOW_MS = 15 * 60 * 1000;
export const MODEL_FAILURE_THRESHOLD = 3;
export const MODEL_FAILURE_COOLDOWN_MS = 10 * 60 * 1000;

const cooldowns = new Map<string, CooldownEntry>();
const modelFailureStreaks = new Map<string, number[]>();

export const buildKeyModelCooldownKey = (
    apiKeysManagerId: string,
    modelSelectionId: string,
): string => `key_model:${apiKeysManagerId}:${modelSelectionId}`;

export const buildKeyProviderCooldownKey = (
    apiKeysManagerId: string,
    providerId: string,
): string => `key_provider:${apiKeysManagerId}:${providerId}`;

export const buildModelCooldownKey = (modelId: string): string =>
    `model:${modelId}`;

export const setCooldown = (
    key: string,
    durationMs: number,
    reason: string,
    now = Date.now(),
): void => {
    if (durationMs <= 0) {
        return;
    }

    const nextExpiry = now + durationMs;
    const existing = cooldowns.get(key);
    if (existing && existing.expiresAt >= nextExpiry) {
        return;
    }

    cooldowns.set(key, { expiresAt: nextExpiry, reason });
};

export const isOnCooldown = (key: string, now = Date.now()): boolean => {
    const entry = cooldowns.get(key);
    if (!entry) {
        return false;
    }

    if (entry.expiresAt <= now) {
        cooldowns.delete(key);
        return false;
    }

    return true;
};

export const getSoonestCooldownExpiry = (
    keys: string[],
    now = Date.now(),
): number | null => {
    let soonest: number | null = null;

    for (const key of keys) {
        const entry = cooldowns.get(key);
        if (!entry) {
            continue;
        }
        if (entry.expiresAt <= now) {
            cooldowns.delete(key);
            continue;
        }
        if (soonest === null || entry.expiresAt < soonest) {
            soonest = entry.expiresAt;
        }
    }

    return soonest;
};

export const formatCooldownEta = (
    expiresAt: number | null,
    now = Date.now(),
): string | null => {
    if (expiresAt === null) {
        return null;
    }

    const deltaMs = expiresAt - now;
    if (deltaMs <= 0) {
        return null;
    }

    const secs = Math.round(deltaMs / 1000);
    if (secs < 90) {
        return `~${secs}s`;
    }

    const mins = Math.round(secs / 60);
    if (mins < 90) {
        return `~${mins}m`;
    }

    return `~${Math.round(mins / 60)}h`;
};

export const recordModelFailureStreak = (
    modelId: string,
    now = Date.now(),
): boolean => {
    const recent = (modelFailureStreaks.get(modelId) ?? []).filter(
        (ts) => now - ts < MODEL_FAILURE_WINDOW_MS,
    );
    recent.push(now);
    modelFailureStreaks.set(modelId, recent);

    if (recent.length < MODEL_FAILURE_THRESHOLD) {
        return false;
    }

    setCooldown(
        buildModelCooldownKey(modelId),
        MODEL_FAILURE_COOLDOWN_MS,
        "repeated_failure_streak",
        now,
    );
    modelFailureStreaks.delete(modelId);
    return true;
};

export const clearModelFailureStreak = (modelId: string): void => {
    modelFailureStreaks.delete(modelId);
};
