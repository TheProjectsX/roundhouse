export const queryKeys = {
    me: {
        profile: ["me", "profile"] as const,
    },
    apikeys: {
        all: ["apikeys"] as const,
        list: (filters?: Record<string, unknown>) => ["apikeys", "list", filters ?? {}] as const,
        detail: (id: string) => ["apikeys", "detail", id] as const,
        models: (id: string) => ["apikeys", "models", id] as const,
    },
    providers: {
        all: ["providers"] as const,
        list: (filters?: Record<string, unknown>) => ["providers", "list", filters ?? {}] as const,
        detail: (id: string) => ["providers", "detail", id] as const,
        models: (id: string) => ["providers", "models", id] as const,
    },
    keysManager: {
        all: ["keys-manager"] as const,
        list: (filters?: Record<string, unknown>) => ["keys-manager", "list", filters ?? {}] as const,
        unlocked: ["keys-manager", "unlocked"] as const,
    },
    admin: {
        analytics: ["admin", "analytics"] as const,
        providers: (filters?: Record<string, unknown>) => ["admin", "providers", filters ?? {}] as const,
        users: (filters?: Record<string, unknown>) => ["admin", "users", filters ?? {}] as const,
    },
};
