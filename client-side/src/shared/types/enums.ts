export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BANNED = "BANNED",
    PENDING = "PENDING",
}

export enum ContentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DEPRECATED = "DEPRECATED",
    TESTING = "TESTING",
    UPCOMING = "UPCOMING",
}

export enum ProviderType {
    OPENAI = "OPENAI",
    ANTHROPIC = "ANTHROPIC",
    GEMINI = "GEMINI",
    CUSTOM = "CUSTOM",
}

export enum RoundhouseMethod {
    RANDOM = "RANDOM",
    EFFICIENCY = "EFFICIENCY",
    PRIORITY = "PRIORITY",
}
