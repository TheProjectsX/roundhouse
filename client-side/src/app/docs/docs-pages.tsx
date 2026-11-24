import Link from "next/link";
import type { ReactNode } from "react";
import {
    CircuitryIcon,
    InfoIcon,
    LightbulbIcon,
    LockKeyIcon,
    PathIcon,
    WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/shared/components/ui/badge";
import { CodeBlock } from "./_components/code-block";
import { DocsContent } from "./_components/docs-content";
import { EndpointBlock } from "./_components/endpoint-block";
import type { DocSlug } from "./docs-config";

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="grid gap-4 border-t border-(--color-border-subtle) pt-8 first:border-t-0 first:pt-0">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function Callout({
    tone = "note",
    title,
    children,
}: {
    tone?: "note" | "tip" | "warning";
    title: string;
    children: ReactNode;
}) {
    const styles = {
        note: {
            box: "border-[color-mix(in_srgb,var(--color-status-info)_30%,var(--color-border-primary))] bg-[color-mix(in_srgb,var(--color-status-info)_8%,var(--color-bg-card))]",
            icon: "text-(--color-status-info)",
            Icon: InfoIcon,
        },
        tip: {
            box: "border-[color-mix(in_srgb,var(--color-accent-primary)_30%,var(--color-border-primary))] bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-bg-card))]",
            icon: "text-(--color-accent-primary)",
            Icon: LightbulbIcon,
        },
        warning: {
            box: "border-[color-mix(in_srgb,var(--color-status-warning)_30%,var(--color-border-primary))] bg-[color-mix(in_srgb,var(--color-status-warning)_8%,var(--color-bg-card))]",
            icon: "text-(--color-status-warning)",
            Icon: WarningIcon,
        },
    }[tone];

    const Icon = styles.Icon;

    return (
        <div className={`flex items-start gap-3 rounded-md border p-4 ${styles.box}`}>
            <Icon size={18} weight="fill" className={`mt-1 shrink-0 ${styles.icon}`} />
            <div className="min-w-0 text-sm leading-6">
                <p className="font-semibold text-(--color-text-primary)">{title}</p>
                <div className="mt-1 text-(--color-text-secondary)">{children}</div>
            </div>
        </div>
    );
}

function InfoGrid({
    items,
}: {
    items: Array<{ title: ReactNode; body: ReactNode }>;
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="grid content-start gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4"
                >
                    <h3 className="text-(--color-text-primary)">{item.title}</h3>
                    <p className="text-sm leading-6 text-(--color-text-secondary)">{item.body}</p>
                </div>
            ))}
        </div>
    );
}

function DocsTable({
    headers,
    rows,
}: {
    headers: string[];
    rows: Array<ReactNode[]>;
}) {
    return (
        <div className="overflow-x-auto rounded-md border border-(--color-border-primary) bg-(--color-bg-card)">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b border-(--color-border-primary) bg-(--color-bg-primary)">
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle)">
                    {rows.map((cells, rowIndex) => (
                        <tr key={rowIndex} className="align-top">
                            {cells.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-3 leading-6 text-(--color-text-secondary)">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StepList({ steps }: { steps: ReactNode[] }) {
    return (
        <ol className="grid gap-3">
            {steps.map((step, index) => (
                <li
                    key={index}
                    className="flex items-start gap-3.5 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) px-4 py-3"
                >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) font-mono text-xs font-semibold text-(--color-text-primary)">
                        {index + 1}
                    </span>
                    <div className="min-w-0 text-sm leading-6 text-(--color-text-secondary)">{step}</div>
                </li>
            ))}
        </ol>
    );
}

function EndpointGroup({ children }: { children: ReactNode }) {
    return <div className="grid gap-4">{children}</div>;
}

function ArchitectureDiagram() {
    const stages = [
        {
            step: "01",
            label: "Client App",
            body: "Sends one OpenAI-style request to the Roundhouse runtime.",
        },
        {
            step: "02",
            label: "Roundhouse API Key",
            body: "Supplies retry depth, routing strategy, and attached provider selections.",
        },
        {
            step: "03",
            label: "Candidate Pool",
            body: "Builds active provider-model-key combinations that match current filters.",
        },
        {
            step: "04",
            label: "Upstream Provider",
            body: "Receives the translated request and returns the provider response.",
        },
    ];

    return (
        <div className="grid gap-4">
            <div>
                <h3>How a request moves through Roundhouse</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {stages.map((stage) => (
                    <div
                        key={stage.step}
                        className="rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4"
                    >
                        <span className="inline-flex rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-2 py-0.5 font-mono text-xs font-semibold text-(--color-text-primary)">
                            Step {stage.step}
                        </span>
                        <p className="mt-2.5 font-semibold text-(--color-text-primary)">{stage.label}</p>
                        <p className="mt-1.5 text-sm leading-6 text-(--color-text-secondary)">{stage.body}</p>
                    </div>
                ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-(--color-border-subtle) bg-(--color-bg-secondary) p-4">
                    <p className="text-sm font-semibold text-(--color-text-primary)">Compatibility plane</p>
                    <p className="mt-1.5 text-sm leading-6">
                        Keep your existing request format and point your SDK at <code>/v1</code>.
                    </p>
                </div>
                <div className="rounded-md border border-(--color-border-subtle) bg-(--color-bg-secondary) p-4">
                    <p className="text-sm font-semibold text-(--color-text-primary)">Routing plane</p>
                    <p className="mt-1.5 text-sm leading-6">
                        Roundhouse orders candidates, excludes failures, and retries within the iteration limit.
                    </p>
                </div>
                <div className="rounded-md border border-(--color-border-subtle) bg-(--color-bg-secondary) p-4">
                    <p className="text-sm font-semibold text-(--color-text-primary)">Control plane</p>
                    <p className="mt-1.5 text-sm leading-6">
                        The dashboard configures providers, models, keys, and priorities without changing the runtime contract.
                    </p>
                </div>
            </div>
        </div>
    );
}

function renderIntroductionPage() {
    return (
        <DocsContent slug="introduction">
            <section className="grid gap-6">
                <div className="grid gap-5 border-b border-(--color-border-primary) pb-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>OpenAI-compatible runtime</Badge>
                        <Badge>Default local base URL: http://localhost:5000</Badge>
                    </div>
                    <div className="grid gap-3">
                        <h2 className="text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
                            One endpoint. Many models. Smarter retries.
                        </h2>
                        <p className="max-w-[65ch] text-base leading-7 text-(--color-text-secondary)">
                            Roundhouse is an orchestration layer for multi-provider LLM traffic. It gives every consumer-facing API key its own routing policy, fallback behavior, model pool, and credential attachments while preserving the familiar OpenAI request format.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4">
                            <p className="text-sm font-semibold text-(--color-text-primary)">3 runtime routes</p>
                            <p className="mt-1.5 text-sm leading-6">
                                <code>/v1/chat/completions</code>, <code>/v1/responses</code>, and <code>/v1/models</code>.
                            </p>
                        </div>
                        <div className="rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4">
                            <p className="text-sm font-semibold text-(--color-text-primary)">Per-key routing</p>
                            <p className="mt-1.5 text-sm leading-6">
                                Set strategy, retries, active providers, and model priority per key.
                            </p>
                        </div>
                        <div className="rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4">
                            <p className="text-sm font-semibold text-(--color-text-primary)">Built for failover</p>
                            <p className="mt-1.5 text-sm leading-6">
                                Failed model-key pairs are excluded before the next retry hop.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/docs/quickstart"
                            className="inline-flex items-center gap-2 rounded-sm border border-(--color-accent-primary) bg-(--color-accent-primary) px-4 py-2 text-sm font-medium text-(--color-text-inverse)! no-underline! hover:bg-(--color-accent-primary-hover)"
                        >
                            Start integrating
                        </Link>
                        <Link
                            href="/docs/openai-compatibility"
                            className="inline-flex items-center gap-2 rounded-sm border border-(--color-border-primary) bg-(--color-bg-card) px-4 py-2 text-sm font-medium text-(--color-text-primary) no-underline! hover:bg-(--color-bg-card-hover)"
                        >
                            View compatibility guide
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <CodeBlock
                        language="bash"
                        title="Request snapshot"
                        code={`curl http://localhost:5000/v1/chat/completions \\
  -H "Authorization: Bearer rh_live_..." \\
  -H "Content-Type: application/json" \\
  -H "x-roundhouse-method: efficiency" \\
  -d '{
    "model": "auto",
    "messages": [{ "role": "user", "content": "Hello from Roundhouse." }]
  }'`}
                    />
                    <div className="grid content-start gap-3 rounded-xl border border-(--color-border-primary) bg-(--color-bg-card) p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)">
                            Best fit
                        </p>
                        <ul className="list-none! space-y-3! pl-0! text-sm">
                            <li className="flex items-start gap-3">
                                <CircuitryIcon size={18} className="mt-1 shrink-0 text-(--color-accent-primary)" />
                                <span>Teams routing one app across several providers.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <PathIcon size={18} className="mt-1 shrink-0 text-(--color-accent-primary)" />
                                <span>Platforms that need controlled failover rather than single-provider lock-in.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <LockKeyIcon size={18} className="mt-1 shrink-0 text-(--color-accent-primary)" />
                                <span>Workflows that separate runtime keys from upstream provider credentials.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <Section id="overview" title="What Roundhouse Does">
                <p>
                    Roundhouse separates configuration from runtime traffic. Teams use the dashboard to create accounts, configure providers, store upstream keys, and assign model catalogs to a Roundhouse key. Production callers then send a single OpenAI-style request to Roundhouse, and the platform decides which provider, model, and upstream key combination should execute it.
                </p>
                <ul>
                    <li>
                        Runtime compatibility routes live under <code>/v1/*</code> and accept a Roundhouse API key via <code>Authorization: Bearer</code> or <code>x-api-key</code>.
                    </li>
                    <li>
                        The backend is a NestJS app with MongoDB via Prisma and exposes Swagger at <code>/api/v1</code> in non-production environments.
                    </li>
                    <li>
                        These docs focus on the public runtime contract and operational behavior rather than internal dashboard endpoints.
                    </li>
                </ul>
            </Section>

            <Section id="concepts" title="Core Concepts">
                <InfoGrid
                    items={[
                        {
                            title: "Roundhouse API key",
                            body: "A consumer-facing key that owns retry count, selection method, and the providers/models available to that consumer.",
                        },
                        {
                            title: "Vault key",
                            body: "An upstream provider credential attached to provider selections for execution.",
                        },
                        {
                            title: "Provider selection",
                            body: "A link between one Roundhouse API key and one provider, plus one or more upstream keys.",
                        },
                        {
                            title: "Model selection",
                            body: "An active or inactive model record under a provider selection, with priority and usage statistics.",
                        },
                        {
                            title: "Routing method",
                            body: (
                                <>
                                    One of <code>RANDOM</code>, <code>EFFICIENCY</code>, or <code>PRIORITY</code>, used to order the candidate pool before failover begins.
                                </>
                            ),
                        },
                        {
                            title: "Last error memory",
                            body: "A temporary exclusion list so failed model-key combinations are skipped during the current cycle.",
                        },
                    ]}
                />
            </Section>

            <Section id="request-flow" title="Request Lifecycle">
                <ArchitectureDiagram />
            </Section>

            <Section id="architecture" title="Architecture Overview">
                <p>The backend composes several focused modules under a single NestJS application:</p>
                <ul>
                    <li>
                        <strong>AuthModule</strong> handles dashboard identity and session issuance.
                    </li>
                    <li>
                        <strong>MeModule</strong> owns profile, custom provider, custom model, and vault-key management.
                    </li>
                    <li>
                        <strong>ApikeysModule</strong> owns Roundhouse API keys, provider selections, model selections, and priority&nbsp;ordering.
                    </li>
                    <li>
                        <strong>OpenaiModule</strong> implements the OpenAI-compatible <code>/v1</code> endpoints and calls the roundhouse executor.
                    </li>
                    <li>
                        <strong>AdminModule</strong> manages the global provider catalog, user accounts, analytics, and admin login.
                    </li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderQuickstartPage() {
    return (
        <DocsContent slug="quickstart">
            <Section id="before-you-start" title="Before You Start">
                <p>The fastest path from signup to a working OpenAI-compatible call takes five steps:</p>
                <StepList
                    steps={[
                        "Create a user account and sign in to the dashboard.",
                        "Create a Roundhouse API key.",
                        "Add at least one upstream provider credential in the Key Vault.",
                        "Attach a provider to the Roundhouse key and keep at least one model active.",
                        <>
                            Send an OpenAI-compatible request to <code>http://localhost:5000/v1/chat/completions</code>.
                        </>,
                    ]}
                />
            </Section>

            <Section id="create-account" title="Create an Account">
                <p>
                    Create a standard user account in the dashboard, then sign in. Roundhouse uses that session for setup tasks such as creating API keys, attaching providers, and storing upstream credentials.
                </p>
            </Section>

            <Section id="create-roundhouse-key" title="Create a Roundhouse API Key">
                <p>Create a key from the API Keys screen and configure:</p>
                <ul>
                    <li>a descriptive name</li>
                    <li>
                        <code>maxIterations</code> for retry depth
                    </li>
                    <li>
                        a default routing method such as <code>EFFICIENCY</code> or <code>PRIORITY</code>
                    </li>
                </ul>
                <Callout tone="tip" title="Dashboard JWT vs. Runtime Key">
                    The generated Roundhouse key (<code>rh_...</code>), not your dashboard session token, is what authenticates runtime <code>/v1/*</code> traffic.
                </Callout>
            </Section>

            <Section id="add-vault-key" title="Add a Vault Key">
                <p>
                    Add at least one upstream provider key in the Key Vault screen. These entries are masked by default and can be revealed again only after re-entering your account password.
                </p>
            </Section>

            <Section id="attach-provider" title="Attach a Provider and Models">
                <p>
                    Select a global or custom provider for the Roundhouse key, then attach one or more upstream keys. Roundhouse automatically creates model selection records for every model already registered under that provider. You can later disable specific ones or reorder priorities.
                </p>
            </Section>

            <Section id="make-request" title="Make Your First Request">
                <CodeBlock
                    language="bash"
                    title="Send a chat completion"
                    code={`curl http://localhost:5000/v1/chat/completions \\
  -H "Authorization: Bearer rh_your_roundhouse_key" \\
  -H "Content-Type: application/json" \\
  -H "x-roundhouse-method: efficiency" \\
  -H "x-models: openai/gpt-4o-mini" \\
  -d '{
    "model": "auto",
    "messages": [
      { "role": "user", "content": "Say hello from Roundhouse." }
    ]
  }'`}
                />
                <p>
                    If the first candidate fails, the executor records a temporary exclusion and retries another candidate until it either succeeds or reaches <code>maxIterations</code>.
                </p>
            </Section>
        </DocsContent>
    );
}

function renderAuthenticationPage() {
    return (
        <DocsContent slug="authentication">
            <Section id="account-auth" title="Account Authentication">
                <p>
                    Dashboard and admin access use JWT Bearer tokens. Standard users and admins sign in through separate application flows, but both end up with the same core session model: a token that represents the current account and role.
                </p>
                <InfoGrid
                    items={[
                        {
                            title: "Register",
                            body: (
                                <>
                                    Creates a user record with email, hashed password, display name, active status, and default <code>USER</code> role.
                                </>
                            ),
                        },
                        {
                            title: "Login",
                            body: "Verifies credentials, rejects inactive users, and returns session tokens for the dashboard.",
                        },
                        {
                            title: "Change password",
                            body: "Requires the current password before storing a newly hashed replacement.",
                        },
                    ]}
                />
            </Section>

            <Section id="jwt-lifecycle" title="JWT Tokens">
                <ul>
                    <li>
                        The access token payload contains the user <code>id</code> and <code>email</code>.
                    </li>
                    <li>
                        The guard verifies tokens with <code>JWT_SECRET</code> and rejects inactive users.
                    </li>
                    <li>
                        The frontend injects <code>Authorization: Bearer &lt;jwt&gt;</code> while you configure the platform from the dashboard.
                    </li>
                    <li>
                        The admin sign-in flow currently returns only an access token, while the standard user sign-in flow also returns a refresh token.
                    </li>
                </ul>
            </Section>

            <Section id="route-protection" title="Protected Routes">
                <p>
                    Most setup flows are protected by the global Nest <code>AuthGuard</code>. Public exceptions include:
                </p>
                <ul>
                    <li>
                        <code>/v1/chat/completions</code>, <code>/v1/responses</code>, and <code>/v1/models</code>
                    </li>
                    <li>sign-in and sign-up flows in the application shell</li>
                </ul>
                <p>
                    Admin-only areas also require the <code>ADMIN</code> role through the <code>@Roles(&quot;ADMIN&quot;)</code> decorator.
                </p>
            </Section>

            <Section id="runtime-auth" title="Runtime API Authentication">
                <p>OpenAI-compatible requests do not use the dashboard JWT. They authenticate with a Roundhouse API key instead.</p>
                <ul>
                    <li>
                        Preferred header: <code>Authorization: Bearer rh_...</code>
                    </li>
                    <li>
                        Alternative header: <code>x-api-key: rh_...</code>
                    </li>
                    <li>If the key is missing, the runtime returns an OpenAI-style authentication error body.</li>
                </ul>
                <CodeBlock
                    language="http"
                    title="Runtime request headers"
                    code={`Authorization: Bearer rh_live_...
x-roundhouse-method: priority
x-max-iterations: 4
x-models: openai/gpt-4o-mini,anthropic/claude-3-5-sonnet`}
                />
            </Section>
        </DocsContent>
    );
}

function renderApiKeysPage() {
    return (
        <DocsContent slug="api-keys">
            <Section id="api-key-object" title="API Key Object">
                <p>The Roundhouse API key record stores:</p>
                <ul>
                    <li>
                        <code>name</code> and generated <code>key</code>
                    </li>
                    <li>
                        <code>active</code> toggle
                    </li>
                    <li>
                        <code>maxIterations</code>, defaulting to <code>3</code>
                    </li>
                    <li>
                        <code>roundhouseMethod</code>, defaulting to <code>EFFICIENCY</code>
                    </li>
                    <li>related provider selections and temporary last-error records</li>
                </ul>
            </Section>

            <Section id="routing-settings" title="Routing Settings">
                <InfoGrid
                    items={[
                        {
                            title: "RANDOM",
                            body: "Shuffles the candidate list before execution and chooses a random candidate per retry cycle.",
                        },
                        {
                            title: "EFFICIENCY",
                            body: (
                                <>
                                    Sorts candidates descending by <code>efficiencyScore</code>, using <code>0.5</code> as the default score when one is missing.
                                </>
                            ),
                        },
                        {
                            title: "PRIORITY",
                            body: (
                                <>
                                    Sorts by ascending <code>priority</code>, then breaks ties by higher efficiency score.
                                </>
                            ),
                        },
                    ]}
                />
                <p>
                    Runtime callers can override the stored method with <code>x-roundhouse-method</code> and can override retry count with <code>x-max-iterations</code>.
                </p>
            </Section>

            <Section id="provider-selections" title="Provider Selections">
                <p>Each provider selection links one API key to one provider plus one or more upstream keys:</p>
                <ul>
                    <li>global providers come from the shared catalog</li>
                    <li>custom providers belong to a specific user</li>
                    <li>at least one upstream key should be attached so Roundhouse has a credential it can use at runtime</li>
                    <li>adding a provider also creates model selection rows for every model already registered under it</li>
                </ul>
            </Section>

            <Section id="model-priorities" title="Model Priorities">
                <p>
                    Priority values matter only when the effective routing strategy is <code>PRIORITY</code>. Lower numeric values are tried first. When priorities tie, Roundhouse falls back to higher efficiency scores.
                </p>
            </Section>

            <Section id="lifecycle" title="Lifecycle Operations">
                <ul>
                    <li>create, rename, enable, and disable Roundhouse keys</li>
                    <li>change retry and routing settings</li>
                    <li>add or remove provider selections</li>
                    <li>activate or deactivate provider and model selections</li>
                    <li>
                        reorder model priorities for <code>PRIORITY</code> routing
                    </li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderProvidersPage() {
    return (
        <DocsContent slug="providers">
            <Section id="provider-types" title="Provider Types">
                <p>
                    Roundhouse currently models provider types as <code>OPENAI</code>, <code>ANTHROPIC</code>, <code>GEMINI</code>, and <code>CUSTOM</code>.
                </p>
                <p>
                    The provider type becomes part of OpenAI-compatible model IDs, for example <code>openai/gpt-4o-mini</code> or <code>anthropic/claude-3-5-sonnet</code>.
                </p>
            </Section>

            <Section id="global-vs-custom" title="Global vs Custom">
                <InfoGrid
                    items={[
                        {
                            title: "Global providers",
                            body: "Created by admins and shared across users. Best for the platform-wide catalog.",
                        },
                        {
                            title: "Custom providers",
                            body: "Created by individual users. Best for private gateways, experiments, and internal endpoints.",
                        },
                        {
                            title: "Merged listing",
                            body: "The provider browser combines global and custom entries into one operational view.",
                        },
                    ]}
                />
            </Section>

            <Section id="custom-providers" title="Creating Custom Providers">
                <p>
                    Custom providers are created from the dashboard with a name, optional code, description, base URL, free flag, type, and status.
                </p>
                <CodeBlock
                    language="json"
                    title="Custom provider payload"
                    code={`{
  "name": "Private Gateway",
  "code": "private-gateway",
  "description": "Internal gateway for experimental models",
  "baseApi": "https://llm.internal.example.com",
  "type": "CUSTOM",
  "status": "ACTIVE"
}`}
                />
                <p>The backend normalizes the provider code to a lowercase slug when you omit one or change the name.</p>
            </Section>

            <Section id="provider-models" title="Managing Models">
                <ul>
                    <li>
                        <code>name</code> and <code>code</code>
                    </li>
                    <li>
                        <code>maxTokens</code> and <code>tokenResetInterval</code>
                    </li>
                    <li>
                        <code>efficiencyScore</code> from <code>0</code> to <code>1</code>
                    </li>
                    <li>
                        <code>bestFor</code> labels and a boolean <code>thinking</code> flag
                    </li>
                    <li>
                        <code>status</code> such as <code>ACTIVE</code>, <code>TESTING</code>, or <code>DEPRECATED</code>
                    </li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderKeyVaultPage() {
    return (
        <DocsContent slug="key-vault">
            <Section id="vault-records" title="Vault Records">
                <p>
                    Vault entries store a user-facing name, an optional provider hint, the upstream credential itself, an active toggle, and accumulated success count.
                </p>
                <Callout tone="note" title="Masking & Unlock Controls">
                    Standard list responses mask every key value. Revealing raw credentials requires re-entering your account password.
                </Callout>
            </Section>

            <Section id="unlock-flow" title="Unlock Flow">
                <p>Unlocking requires the user account password, not the session token alone:</p>
                <CodeBlock language="json" title="Unlock request" code={`{ "password": "your-account-password" }`} />
                <ul>
                    <li>Roundhouse verifies the password against the stored bcrypt hash.</li>
                    <li>If valid, it returns a list of revealed key values for that user.</li>
                    <li>The frontend keeps revealed values only in memory and offers a manual lock action to clear them.</li>
                </ul>
            </Section>

            <Section id="masking" title="Masking and Exposure">
                <p>
                    Standard list responses censor every <code>key</code> field recursively.
                </p>
                <p>
                    Short keys are fully masked. Longer keys keep the first and last four characters, for example <code>sk-l*****abcd</code>.
                </p>
            </Section>

            <Section id="usage" title="How Vault Keys Are Used">
                <ul>
                    <li>Vault entries are attached to provider selections.</li>
                    <li>During runtime, Roundhouse picks one attached active key for the chosen candidate.</li>
                    <li>If that upstream call fails, the exact model-selection and upstream-key pair is temporarily excluded for the rest of the retry cycle.</li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderModelsPage() {
    return (
        <DocsContent slug="models">
            <Section id="model-catalog" title="Model Catalogs">
                <p>Roundhouse has two model catalogs:</p>
                <ul>
                    <li>
                        <strong>Global models</strong> managed by admins.
                    </li>
                    <li>
                        <strong>User models</strong> managed by the owner of a custom provider.
                    </li>
                </ul>
                <p>Both share the same routing-relevant fields, so the executor can treat them uniformly once they are attached to a provider selection.</p>
            </Section>

            <Section id="selection-stats" title="Selection Statistics">
                <p>Every attached model becomes a model-selection record that tracks:</p>
                <ul>
                    <li>
                        <code>tokenUsage</code>
                    </li>
                    <li>
                        <code>successCount</code>
                    </li>
                    <li>
                        <code>failureCount</code>
                    </li>
                    <li>
                        <code>lastUsedAt</code>
                    </li>
                    <li>
                        <code>priority</code> and <code>active</code>
                    </li>
                </ul>
                <p>The runtime queues success-side statistics updates in the background after each successful completion or response request.</p>
            </Section>

            <Section id="activation" title="Activation Controls">
                <ul>
                    <li>the provider itself can be inactive or deprecated</li>
                    <li>a provider selection under a specific Roundhouse key can be toggled active or inactive</li>
                    <li>an individual model selection under that provider selection can be toggled active or inactive</li>
                </ul>
            </Section>

            <Section id="priority-order" title="Priority Ordering">
                <p>
                    The API key settings screen is built around drag-and-drop priority editing. Lower numbers win first when the key uses <code>PRIORITY</code> routing.
                </p>
            </Section>
        </DocsContent>
    );
}

function renderApiReferencePage() {
    return (
        <DocsContent slug="api-reference">
            <Section id="runtime-endpoints" title="Runtime Endpoints">
                <EndpointGroup>
                    <EndpointBlock
                        method="POST"
                        path="/v1/chat/completions"
                        description="OpenAI-style chat completion endpoint with optional streaming and Roundhouse routing headers."
                        auth="Roundhouse API key"
                        requestExample={`{
  "model": "auto",
  "messages": [
    { "role": "user", "content": "Say hello from Roundhouse." }
  ]
}`}
                    />
                    <EndpointBlock
                        method="POST"
                        path="/v1/responses"
                        description={
                            <>
                                OpenAI responses endpoint supporting <code>input</code> or <code>messages</code>.
                            </>
                        }
                        auth="Roundhouse API key"
                        requestExample={`{
  "model": "roundhouse",
  "input": "Summarize the request lifecycle."
}`}
                    />
                    <EndpointBlock
                        method="GET"
                        path="/v1/models"
                        description="List synthetic Roundhouse aliases plus active provider-backed model identifiers."
                        auth="Optional in current implementation"
                    />
                </EndpointGroup>
            </Section>

            <Section id="routing-headers" title="Routing Headers">
                <DocsTable
                    headers={["Header", "Effect"]}
                    rows={[
                        [
                            <code key="h1">x-roundhouse-method</code>,
                            <>
                                Overrides the stored strategy with <code>random</code>, <code>efficiency</code>, or <code>priority</code>.
                            </>,
                        ],
                        [
                            <code key="h2">x-max-iterations</code>,
                            "Overrides the retry limit for the current request.",
                        ],
                        [
                            <code key="h3">x-models</code>,
                            "Limits candidates by model code or provider/model token.",
                        ],
                        [
                            <code key="h4">x-providers</code>,
                            <>
                                Adds provider tokens into the same filter set used by <code>x-models</code>.
                            </>,
                        ],
                    ]}
                />
            </Section>

            <Section id="request-shapes" title="Request Shapes">
                <p>
                    The chat completions body requires at least one message. The responses body requires either <code>input</code> or <code>messages</code>.
                </p>
                <CodeBlock
                    language="json"
                    title="Chat completions request"
                    code={`{
  "model": "auto",
  "messages": [
    { "role": "user", "content": "Route this request for me." }
  ],
  "stream": false,
  "tools": []
}`}
                />
            </Section>

            <Section id="response-shapes" title="Response Shapes">
                <p>Successful responses preserve the upstream provider format. Failures use OpenAI-style error bodies.</p>
                <CodeBlock
                    language="json"
                    title="Error response"
                    code={`{
  "error": {
    "message": "Maximum roundhouse iterations reached.",
    "type": "invalid_request_error",
    "code": "RH301"
  }
}`}
                />
            </Section>

            <Section id="model-catalog" title="Model Catalog Semantics">
                <ul>
                    <li>
                        <code>auto</code> and <code>roundhouse</code> are synthetic aliases handled by Roundhouse.
                    </li>
                    <li>
                        Concrete models are emitted as <code>{`<providerType>/<modelCode>`}</code>, such as <code>openai/gpt-4o-mini</code>.
                    </li>
                    <li>Only active providers and active models appear in the runtime model list.</li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderOpenAICompatibilityPage() {
    return (
        <DocsContent slug="openai-compatibility">
            <Section id="supported-endpoints" title="Supported Endpoints">
                <InfoGrid
                    items={[
                        {
                            title: "POST /v1/chat/completions",
                            body: "Supports OpenAI-style messages, optional tools, and streaming via SSE.",
                        },
                        {
                            title: "POST /v1/responses",
                            body: (
                                <>
                                    Supports <code>input</code> or <code>messages</code>, optional tools, and OpenAI response semantics.
                                </>
                            ),
                        },
                        {
                            title: "GET /v1/models",
                            body: (
                                <>
                                    Returns <code>auto</code>, <code>roundhouse</code>, plus active provider-backed model IDs such as <code>openai/gpt-4o-mini</code>.
                                </>
                            ),
                        },
                    ]}
                />
            </Section>

            <Section id="headers" title="Routing Headers">
                <DocsTable
                    headers={["Header", "Purpose"]}
                    rows={[
                        [
                            <>
                                <code>Authorization</code> or <code>x-api-key</code>
                            </>,
                            "Supplies the Roundhouse API key.",
                        ],
                        [
                            <code key="rh-m">x-roundhouse-method</code>,
                            <>
                                Overrides stored routing strategy with <code>random</code>, <code>efficiency</code>, or <code>priority</code>.
                            </>,
                        ],
                        [
                            <code key="rh-i">x-max-iterations</code>,
                            "Overrides the retry cap for the current request.",
                        ],
                        [
                            <code key="rh-mod">x-models</code>,
                            <>
                                Filters candidate models using names like <code>gpt-4o-mini</code> or <code>openai/gpt-4o-mini</code>.
                            </>,
                        ],
                        [
                            <code key="rh-prov">x-providers</code>,
                            <>
                                Adds provider tokens into the same model-filter set, for example <code>openai</code> or <code>anthropic</code>.
                            </>,
                        ],
                    ]}
                />
            </Section>

            <Section id="sdk-examples" title="SDK Examples">
                <div className="grid gap-4">
                    <CodeBlock
                        language="ts"
                        title="TypeScript / JavaScript (OpenAI SDK)"
                        code={`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ROUNDHOUSE_API_KEY,
  baseURL: "http://localhost:5000/v1",
});

const completion = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello from Roundhouse" }],
});`}
                    />
                    <CodeBlock
                        language="python"
                        title="Python (OpenAI SDK)"
                        code={`from openai import OpenAI

client = OpenAI(
    api_key="rh_live_...",
    base_url="http://localhost:5000/v1",
)

response = client.responses.create(
    model="roundhouse",
    input="Summarize this request path."
)`}
                    />
                </div>
            </Section>

            <Section id="compat-notes" title="Compatibility Notes">
                <ul>
                    <li>
                        The service rewrites the outgoing model to the selected provider/type plus model code, for example <code>openai/gpt-4o-mini</code>.
                    </li>
                    <li>
                        Passing <code>model: &quot;auto&quot;</code> or <code>model: &quot;roundhouse&quot;</code> keeps model selection fully under Roundhouse control.
                    </li>
                    <li>Streaming chat completions are returned as Server-Sent Events with the upstream chunks joined directly into the response stream.</li>
                    <li>
                        <code>GET /v1/models</code> returns active models from the provider catalog and also includes the synthetic <code>auto</code> and <code>roundhouse</code> entries.
                    </li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderRoundhouseAlgorithmPage() {
    return (
        <DocsContent slug="roundhouse-algorithm">
            <Section id="candidate-pool" title="Candidate Pool Construction">
                <p>The executor builds candidates by loading the Roundhouse API key with:</p>
                <ul>
                    <li>active provider selections</li>
                    <li>active upstream keys attached to each selection</li>
                    <li>active model selections under each selection</li>
                    <li>optional request filters for provider or model tokens</li>
                </ul>
                <p>
                    Each candidate is a tuple of provider selection, model selection, provider metadata, model metadata, attached upstream keys, priority, and efficiency score.
                </p>
            </Section>

            <Section id="strategies" title="Routing Strategies">
                <InfoGrid
                    items={[
                        {
                            title: "EFFICIENCY first",
                            body: (
                                <>
                                    Default behavior sorts by <code>efficiencyScore</code> descending and picks the first remaining candidate each iteration.
                                </>
                            ),
                        },
                        {
                            title: "PRIORITY first",
                            body: (
                                <>
                                    Sorts by <code>priority</code> ascending and uses efficiency only as a tie-breaker.
                                </>
                            ),
                        },
                        {
                            title: "RANDOM",
                            body: "Shuffles the candidate list and picks a random available candidate each iteration.",
                        },
                    ]}
                />
            </Section>

            <Section id="failover" title="Failover and Retry">
                <StepList
                    steps={[
                        "The exact model-selection and upstream-key pair is marked excluded.",
                        "A last-error record is written asynchronously.",
                        "The model selection failure counter is incremented asynchronously.",
                        "The executor tries another available candidate until it succeeds or reaches the effective iteration limit.",
                    ]}
                />
                <p>
                    If no matching candidates exist, Roundhouse returns internal codes such as <code>RH201</code> for &ldquo;no available models&rdquo; or <code>RH202</code> for a filter miss.
                </p>
            </Section>

            <Section id="reset-behavior" title="Exclusion Reset Behavior">
                <p>
                    If every model-selection and upstream-key pair becomes excluded during a request cycle, Roundhouse clears the exclusion set and restores the full candidate pool before trying again.
                </p>
            </Section>
        </DocsContent>
    );
}

function renderErrorHandlingPage() {
    return (
        <DocsContent slug="error-handling">
            <Section id="rest-errors" title="Management API Errors">
                <p>The application uses a consistent error envelope for dashboard-oriented flows.</p>
                <CodeBlock
                    language="json"
                    title="Dashboard error envelope"
                    code={`{
  "success": false,
  "message": "Validation failed",
  "errorMessages": [
    { "path": "email", "message": "email must be an email" }
  ]
}`}
                />
            </Section>

            <Section id="openai-errors" title="OpenAI-Compatible Errors">
                <p>
                    The <code>/v1/*</code> routes intentionally return OpenAI-style error bodies instead of the dashboard envelope.
                </p>
                <CodeBlock
                    language="json"
                    title="Runtime error body"
                    code={`{
  "error": {
    "message": "Missing API key. Use Authorization: Bearer <key>.",
    "type": "authentication_error",
    "code": "api_key_missing"
  }
}`}
                />
            </Section>

            <Section id="roundhouse-codes" title="Roundhouse Codes">
                <DocsTable
                    headers={["Code", "Meaning"]}
                    rows={[
                        [<code key="rh101">RH101</code>, "Roundhouse API key not found."],
                        [<code key="rh102">RH102</code>, "Roundhouse API key is inactive."],
                        [<code key="rh201">RH201</code>, "No available models for the current key and filters."],
                        [<code key="rh202">RH202</code>, "Requested provider/model filters matched no models."],
                        [<code key="rh301">RH301</code>, "Maximum roundhouse iterations reached without success."],
                    ]}
                />
            </Section>

            <Section id="troubleshooting" title="Troubleshooting Checklist">
                <ul>
                    <li>
                        If <code>/v1/chat/completions</code> returns an auth error, confirm you are sending the Roundhouse API key, not the dashboard session token.
                    </li>
                    <li>
                        If you get <code>RH201</code>, make sure the key has at least one active provider selection, one active upstream key, and one active model selection.
                    </li>
                    <li>
                        If you get <code>RH202</code>, relax <code>x-models</code> or <code>x-providers</code> filters.
                    </li>
                    <li>
                        If the dashboard reports &ldquo;User is inactive,&rdquo; the session is valid but the account status is not <code>ACTIVE</code>.
                    </li>
                </ul>
            </Section>
        </DocsContent>
    );
}

function renderAdminPage() {
    return (
        <DocsContent slug="admin">
            <Section id="admin-auth" title="Admin Authentication">
                <p>
                    Admins authenticate through the admin sign-in flow. The service checks that the account exists, has the <code>ADMIN</code> role, and that the password matches before issuing an access token.
                </p>
            </Section>

            <Section id="global-catalog" title="Global Provider Catalog">
                <ul>
                    <li>create, update, deprecate, and delete global providers</li>
                    <li>register provider models with efficiency scores, token limits, and usage tags</li>
                    <li>inspect aggregate usage such as token volume, success counts, and unique users per provider</li>
                    <li>compare user-created providers with the shared platform catalog when needed</li>
                </ul>
            </Section>

            <Section id="user-management" title="User Management">
                <p>
                    The admin workspace exposes platform accounts plus summary stats for API keys, custom providers, provider selections, vault usage, and selected models.
                </p>
                <ul>
                    <li>mark users inactive or banned</li>
                    <li>review whether a user still has active runtime keys</li>
                    <li>remove abandoned test accounts</li>
                </ul>
            </Section>

            <Section id="analytics" title="Analytics">
                <InfoGrid
                    items={[
                        {
                            title: "Platform totals",
                            body: "Counts of users, API keys, providers, models, total token usage, total requests, and average success rate.",
                        },
                        {
                            title: "Daily trend",
                            body: "30-day rollups of token usage, success count, failure count, and total requests by day.",
                        },
                        {
                            title: "Top providers",
                            body: "Most-used global and custom model records, merged into a single leaderboard.",
                        },
                    ]}
                />
            </Section>
        </DocsContent>
    );
}

export function renderDocsPage(slug: DocSlug) {
    switch (slug) {
        case "introduction":
            return renderIntroductionPage();
        case "quickstart":
            return renderQuickstartPage();
        case "authentication":
            return renderAuthenticationPage();
        case "api-keys":
            return renderApiKeysPage();
        case "providers":
            return renderProvidersPage();
        case "key-vault":
            return renderKeyVaultPage();
        case "models":
            return renderModelsPage();
        case "api-reference":
            return renderApiReferencePage();
        case "openai-compatibility":
            return renderOpenAICompatibilityPage();
        case "roundhouse-algorithm":
            return renderRoundhouseAlgorithmPage();
        case "error-handling":
            return renderErrorHandlingPage();
        case "admin":
            return renderAdminPage();
        default:
            return renderIntroductionPage();
    }
}
