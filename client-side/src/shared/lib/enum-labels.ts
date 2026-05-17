import {
    ContentStatus,
    ProviderType,
    RoundhouseMethod,
    UserStatus,
} from "@/shared/types/enums";

export const contentStatusLabels: Record<ContentStatus, string> = {
    [ContentStatus.ACTIVE]: "Active",
    [ContentStatus.INACTIVE]: "Inactive",
    [ContentStatus.DEPRECATED]: "Deprecated",
    [ContentStatus.TESTING]: "Testing",
    [ContentStatus.UPCOMING]: "Upcoming",
};

export const providerTypeLabels: Record<ProviderType, string> = {
    [ProviderType.OPENAI]: "OpenAI",
    [ProviderType.ANTHROPIC]: "Anthropic",
    [ProviderType.GEMINI]: "Gemini",
    [ProviderType.CUSTOM]: "Custom",
};

export const roundhouseMethodLabels: Record<RoundhouseMethod, string> = {
    [RoundhouseMethod.RANDOM]: "Random",
    [RoundhouseMethod.EFFICIENCY]: "Efficiency",
    [RoundhouseMethod.PRIORITY]: "Priority",
};

export const userStatusLabels: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "Active",
    [UserStatus.INACTIVE]: "Inactive",
    [UserStatus.BANNED]: "Banned",
    [UserStatus.PENDING]: "Pending",
};
