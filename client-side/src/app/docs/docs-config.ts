export type DocSlug =
    | "introduction"
    | "quickstart"
    | "authentication"
    | "api-keys"
    | "providers"
    | "key-vault"
    | "models"
    | "api-reference"
    | "openai-compatibility"
    | "roundhouse-algorithm"
    | "error-handling"
    | "admin";

export type DocSection = {
    id: string;
    title: string;
};

export type DocNavItem = {
    slug: DocSlug;
    href: string;
    title: string;
    description: string;
    category: "Getting Started" | "Core Concepts" | "Integration" | "Reference";
    icon:
        | "sparkle"
        | "rocket"
        | "lock"
        | "key"
        | "stack"
        | "vault"
        | "cpu"
        | "brackets"
        | "plug"
        | "shuffle"
        | "warning"
        | "shield";
    sections: DocSection[];
};

export const docsNavigation: DocNavItem[] = [
    {
        slug: "introduction",
        href: "/docs",
        title: "Introduction",
        description: "Understand what Roundhouse is and how the platform is organized.",
        category: "Getting Started",
        icon: "sparkle",
        sections: [
            { id: "overview", title: "What Roundhouse Does" },
            { id: "concepts", title: "Core Concepts" },
            { id: "request-flow", title: "Request Lifecycle" },
            { id: "architecture", title: "Architecture Overview" },
        ],
    },
    {
        slug: "quickstart",
        href: "/docs/quickstart",
        title: "Quick Start",
        description: "Go from signup to your first OpenAI-compatible request in a few minutes.",
        category: "Getting Started",
        icon: "rocket",
        sections: [
            { id: "before-you-start", title: "Before You Start" },
            { id: "create-account", title: "Create an Account" },
            { id: "create-roundhouse-key", title: "Create a Roundhouse API Key" },
            { id: "add-vault-key", title: "Add a Vault Key" },
            { id: "attach-provider", title: "Attach a Provider and Models" },
            { id: "make-request", title: "Make Your First Request" },
        ],
    },
    {
        slug: "authentication",
        href: "/docs/authentication",
        title: "Authentication",
        description: "JWT-based dashboard auth and Bearer-key auth for OpenAI-compatible calls.",
        category: "Getting Started",
        icon: "lock",
        sections: [
            { id: "account-auth", title: "Account Authentication" },
            { id: "jwt-lifecycle", title: "JWT Tokens" },
            { id: "route-protection", title: "Protected Routes" },
            { id: "runtime-auth", title: "Runtime API Authentication" },
        ],
    },
    {
        slug: "api-keys",
        href: "/docs/api-keys",
        title: "API Keys",
        description: "Create, tune, and route Roundhouse keys across providers and models.",
        category: "Core Concepts",
        icon: "key",
        sections: [
            { id: "api-key-object", title: "API Key Object" },
            { id: "routing-settings", title: "Routing Settings" },
            { id: "provider-selections", title: "Provider Selections" },
            { id: "model-priorities", title: "Model Priorities" },
            { id: "lifecycle", title: "Lifecycle Operations" },
        ],
    },
    {
        slug: "providers",
        href: "/docs/providers",
        title: "Providers",
        description: "Work with the global catalog or create custom providers and models.",
        category: "Core Concepts",
        icon: "stack",
        sections: [
            { id: "provider-types", title: "Provider Types" },
            { id: "global-vs-custom", title: "Global vs Custom" },
            { id: "custom-providers", title: "Creating Custom Providers" },
            { id: "provider-models", title: "Managing Models" },
        ],
    },
    {
        slug: "key-vault",
        href: "/docs/key-vault",
        title: "Key Vault",
        description: "Store upstream provider credentials and reveal them only after password confirmation.",
        category: "Core Concepts",
        icon: "vault",
        sections: [
            { id: "vault-records", title: "Vault Records" },
            { id: "unlock-flow", title: "Unlock Flow" },
            { id: "masking", title: "Masking and Exposure" },
            { id: "usage", title: "How Vault Keys Are Used" },
        ],
    },
    {
        slug: "models",
        href: "/docs/models",
        title: "Models",
        description: "Select active models, inspect stats, and understand how priority affects routing.",
        category: "Core Concepts",
        icon: "cpu",
        sections: [
            { id: "model-catalog", title: "Model Catalogs" },
            { id: "selection-stats", title: "Selection Statistics" },
            { id: "activation", title: "Activation Controls" },
            { id: "priority-order", title: "Priority Ordering" },
        ],
    },
    {
        slug: "openai-compatibility",
        href: "/docs/openai-compatibility",
        title: "OpenAI Compatibility",
        description: "Reuse existing SDKs with Roundhouse by swapping base URL and API key.",
        category: "Integration",
        icon: "plug",
        sections: [
            { id: "supported-endpoints", title: "Supported Endpoints" },
            { id: "headers", title: "Routing Headers" },
            { id: "sdk-examples", title: "SDK Examples" },
            { id: "compat-notes", title: "Compatibility Notes" },
        ],
    },
    {
        slug: "roundhouse-algorithm",
        href: "/docs/roundhouse-algorithm",
        title: "Roundhouse Algorithm",
        description: "Deep dive into candidate building, scoring, retries, and model exclusion.",
        category: "Integration",
        icon: "shuffle",
        sections: [
            { id: "candidate-pool", title: "Candidate Pool Construction" },
            { id: "strategies", title: "Routing Strategies" },
            { id: "failover", title: "Failover and Retry" },
            { id: "reset-behavior", title: "Exclusion Reset Behavior" },
        ],
    },
    {
        slug: "api-reference",
        href: "/docs/api-reference",
        title: "API Reference",
        description: "Endpoint-by-endpoint guide to the OpenAI-compatible `/v1` runtime surface.",
        category: "Reference",
        icon: "brackets",
        sections: [
            { id: "runtime-endpoints", title: "Runtime Endpoints" },
            { id: "routing-headers", title: "Routing Headers" },
            { id: "request-shapes", title: "Request Shapes" },
            { id: "response-shapes", title: "Response Shapes" },
            { id: "model-catalog", title: "Model Catalog Semantics" },
        ],
    },
    {
        slug: "error-handling",
        href: "/docs/error-handling",
        title: "Error Handling",
        description: "Understand the REST response envelope, OpenAI-style errors, and retry signals.",
        category: "Reference",
        icon: "warning",
        sections: [
            { id: "rest-errors", title: "Management API Errors" },
            { id: "openai-errors", title: "OpenAI-Compatible Errors" },
            { id: "roundhouse-codes", title: "Roundhouse Codes" },
            { id: "troubleshooting", title: "Troubleshooting Checklist" },
        ],
    },
    {
        slug: "admin",
        href: "/docs/admin",
        title: "Admin Guide",
        description: "Manage the global provider catalog, users, and analytics from the admin workspace.",
        category: "Reference",
        icon: "shield",
        sections: [
            { id: "admin-auth", title: "Admin Authentication" },
            { id: "global-catalog", title: "Global Provider Catalog" },
            { id: "user-management", title: "User Management" },
            { id: "analytics", title: "Analytics" },
        ],
    },
];

export const docsBySlug = Object.fromEntries(
    docsNavigation.map((item) => [item.slug, item]),
) as Record<DocSlug, DocNavItem>;

export const docsCategories = ["Getting Started", "Core Concepts", "Integration", "Reference"] as const;

export function getDocBySlug(slug: DocSlug) {
    return docsBySlug[slug];
}

export function getDocByHref(pathname: string) {
    return docsNavigation.find((item) => item.href === pathname) ?? docsBySlug.introduction;
}

export function getAdjacentDocs(slug: DocSlug) {
    const index = docsNavigation.findIndex((item) => item.slug === slug);
    return {
        previous: index > 0 ? docsNavigation[index - 1] : null,
        next: index < docsNavigation.length - 1 ? docsNavigation[index + 1] : null,
    };
}
