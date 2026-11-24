import { createHash } from "crypto";
import type { OpenAIChatMessage } from "@/core/models/types";
import { getMessageText } from "@/core/api-wrapper/normalize";

export const STICKY_SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_STICKY_ENTRIES = 10_000;

type StickyEntry = {
    modelSelectionId: string;
    lastUsedAt: number;
};

const stickySessions = new Map<string, StickyEntry>();

const pruneStickySessions = (now: number): void => {
    for (const [key, entry] of stickySessions) {
        if (now - entry.lastUsedAt > STICKY_SESSION_TTL_MS) {
            stickySessions.delete(key);
        }
    }

    if (stickySessions.size > MAX_STICKY_ENTRIES) {
        const overflow = stickySessions.size - MAX_STICKY_ENTRIES;
        let removed = 0;
        for (const key of stickySessions.keys()) {
            stickySessions.delete(key);
            removed += 1;
            if (removed >= overflow) {
                break;
            }
        }
    }
};

const readHeader = (
    headers: Record<string, string | string[] | undefined> | undefined,
    name: string,
): string | undefined => {
    if (!headers) {
        return undefined;
    }

    const raw = headers[name.toLowerCase()];
    if (Array.isArray(raw)) {
        return raw[0]?.trim() || undefined;
    }
    return typeof raw === "string" ? raw.trim() || undefined : undefined;
};

export const deriveSessionKey = (
    apiKey: string,
    messages: OpenAIChatMessage[] | undefined,
    headers?: Record<string, string | string[] | undefined>,
): string | undefined => {
    const explicitSession =
        readHeader(headers, "x-roundhouse-session") ??
        readHeader(headers, "x-session-id");

    if (explicitSession) {
        return createHash("sha256")
            .update(`${apiKey}:hdr:${explicitSession}`)
            .digest("hex");
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return undefined;
    }

    const firstUserMessage = messages.find((m) => m.role === "user");
    const anchorText = firstUserMessage
        ? getMessageText(firstUserMessage.content).trim()
        : "";
    if (!anchorText) {
        return undefined;
    }

    return createHash("sha256")
        .update(`${apiKey}:msg:${anchorText.slice(0, 512)}`)
        .digest("hex");
};

export const getStickyModelSelectionId = (
    sessionKey: string | undefined,
    now = Date.now(),
): string | undefined => {
    if (!sessionKey) {
        return undefined;
    }

    const entry = stickySessions.get(sessionKey);
    if (!entry) {
        return undefined;
    }

    if (now - entry.lastUsedAt > STICKY_SESSION_TTL_MS) {
        stickySessions.delete(sessionKey);
        return undefined;
    }

    return entry.modelSelectionId;
};

export const recordStickySession = (
    sessionKey: string | undefined,
    modelSelectionId: string,
    now = Date.now(),
): void => {
    if (!sessionKey) {
        return;
    }

    if (stickySessions.size >= MAX_STICKY_ENTRIES) {
        pruneStickySessions(now);
    }

    stickySessions.set(sessionKey, {
        modelSelectionId,
        lastUsedAt: now,
    });
};
