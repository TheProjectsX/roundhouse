import { ContentStatus, ProviderType, RoundhouseMethod, UserRole, UserStatus } from "./enums";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role?: UserRole;
    status: UserStatus;
}

export interface ApiKeyListItem {
    id: string;
    name: string;
    active: boolean;
    key: string;
    maxIterations: number;
    roundhouseMethod: RoundhouseMethod;
    createdAt: string;
    updatedAt: string;
    stats: {
        providerCount: number;
        apiKeysManagerCount: number;
        modelCount: number;
        successfulRequests: number;
    };
}

export interface ApiKeysManagerEntry {
    id: string;
    maskedKey: string;
    active: boolean;
    successCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ModelSelectionEntry {
    id: string;
    modelSelectionId: string;
    name: string;
    code: string;
    maxTokens: number | null;
    tokenResetInterval: number | null;
    efficiencyScore: number | null;
    bestFor: string[];
    thinking: boolean;
    status: ContentStatus;
    active: boolean;
    priority: number;
    isCustom: boolean;
    stats: {
        tokenUsage: number;
        successCount: number;
        failureCount: number;
        lastUsedAt: string | null;
    };
}

export interface ApiKeyModelSelectionListItem {
    id: string;
    modelSelectionId: string;
    priority: number;
    active: boolean;
    model: {
        id: string;
        name: string;
        code: string;
        maxTokens: number | null;
        tokenResetInterval: number | null;
        efficiencyScore: number | null;
        bestFor: string[];
        thinking: boolean;
        status: ContentStatus;
    };
    provider: {
        id: string;
        name: string;
        code: string;
        type: ProviderType;
        baseApi: string;
    };
    stats: {
        tokenUsage: number;
        successCount: number;
        failureCount: number;
        lastUsedAt: string | null;
    };
}

export interface ProviderSelectionDetail {
    id: string;
    providerId: string;
    code: string;
    name: string;
    description: string | null;
    baseApi: string;
    free: boolean;
    type: ProviderType;
    status: ContentStatus;
    active: boolean;
    isCustom: boolean;
    apiKeysManagers: ApiKeysManagerEntry[];
    models: ModelSelectionEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface ApiKeyDetail {
    id: string;
    name: string;
    active: boolean;
    key: string;
    maxIterations: number;
    roundhouseMethod: RoundhouseMethod;
    createdAt: string;
    updatedAt: string;
    providers: ProviderSelectionDetail[];
}

export interface ProviderListItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    baseApi: string;
    free: boolean;
    type: ProviderType;
    status: ContentStatus;
    modelsCount: number;
    activeModelsCount: number;
    connected: boolean;
    active: boolean;
    isCustom: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProviderModelListItem {
    id: string;
    name: string;
    code: string;
    maxTokens: number | null;
    tokenResetInterval: number | null;
    efficiencyScore: number | null;
    bestFor: string[];
    thinking: boolean;
    status: ContentStatus;
    isCustom: boolean;
}

export interface ApiKeysManagerItem {
    id: string;
    name: string;
    provider: string | null;
    key: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UnlockedKey {
    id: string;
    key: string;
}

export interface AdminAnalytics {
    users: number;
    apiKeys: number;
    globalProviders: number;
    customProviders: number;
    models: number;
    userModels: number;
    providerSelections: number;
    providerSelectionApiKeysManagers: number;
}

export interface AdminUserListItem {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    status: UserStatus;
    stats: {
        apiKeyCount: number;
        activeApiKeyCount: number;
        customProviderCount: number;
        activeCustomProviderCount: number;
        providerSelectionCount: number;
        apiKeysManagerCount: number;
        selectedModelCount: number;
    };
    createdAt: string;
    updatedAt: string;
}
