import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined) {
    return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value ?? 0).toString().padStart(2, "0");
}

export function formatDate(value: string | null | undefined) {
    if (!value) return "Never";
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

export function maskKey(value: string, prefixLength = 6, suffixLength = 4) {
    if (value.length <= prefixLength + suffixLength) return "*".repeat(value.length);
    return `${value.slice(0, prefixLength)}${"*".repeat(8)}${value.slice(-suffixLength)}`;
}

export function summarizeErrorMessage(
    message: string | null | undefined,
    fallback = "Operation failed",
    maxLength = 120,
) {
    if (!message) return fallback;
    const normalized = message.replace(/\s+/g, " ").trim();
    if (!normalized) return fallback;

    const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
    const concise =
        firstSentence.length >= 16 && firstSentence.length <= maxLength
            ? firstSentence
            : normalized;

    if (concise.length <= maxLength) return concise;
    return `${concise.slice(0, maxLength - 3).trimEnd()}...`;
}
