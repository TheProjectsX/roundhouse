"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CheckCircleIcon,
    CirclesThreePlusIcon,
    CodeBlockIcon,
    CubeFocusIcon,
    GitBranchIcon,
    ListIcon,
    LockKeyIcon,
    MonitorIcon,
    MoonIcon,
    ShieldCheckIcon,
    StackIcon,
    SunIcon,
    SwapIcon,
    XIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const shellClass = "mx-auto max-w-[1250px] px-4 lg:px-6";

const signalStrip = [
    "OpenAI-compatible /v1 surface",
    "Deterministic failover",
    "Vault-backed provider keys",
    "Global & custom providers",
    "Priority-aware model routing",
    "Admin analytics & oversight",
];

const architectureCards = [
    {
        title: "One endpoint for live traffic",
        body: "Roundhouse sits in front of provider APIs so existing OpenAI SDK flows keep moving while routing decisions execute inside your control plane.",
        eyebrow: "/v1 compatibility",
        className: "md:col-span-12 xl:col-span-7",
        icon: CodeBlockIcon,
    },
    {
        title: "Explicit provider selections",
        body: "Each API key binds provider selections, model selections, vault keys, and activation state without hiding behavior behind opaque defaults.",
        eyebrow: "Configuration depth",
        className: "md:col-span-12 xl:col-span-5",
        icon: StackIcon,
    },
    {
        title: "Efficiency, priority, or random",
        body: "Routing strategy is scoped per API key, letting teams choose deterministic efficiency scoring, ranked priority order, or randomized distribution.",
        eyebrow: "Per-key strategy",
        className: "md:col-span-6 xl:col-span-4",
        icon: GitBranchIcon,
    },
    {
        title: "In-loop failure isolation",
        body: "Failed model selections are excluded inside the active request cycle and recovered if the candidate pool exhausts, bounded by maxIterations.",
        eyebrow: "Roundhouse algorithm",
        className: "md:col-span-6 xl:col-span-4",
        icon: SwapIcon,
    },
    {
        title: "Temporary vault reveal",
        body: "Provider secrets stay masked by default and decrypt in memory only after password verification, auto-locking after five minutes.",
        eyebrow: "Security posture",
        className: "md:col-span-12 xl:col-span-4",
        icon: LockKeyIcon,
    },
    {
        title: "Unified global & custom inventory",
        body: "User-managed private endpoints and platform global providers share identical selection, status, and testing controls.",
        eyebrow: "Shared inventory",
        className: "md:col-span-12 xl:col-span-8",
        icon: CirclesThreePlusIcon,
    },
];

const routingModes = [
    {
        key: "efficiency",
        name: "Efficiency",
        title: "Route to the highest-scoring model first.",
        body: "Roundhouse sorts eligible candidates once per request by efficiencyScore descending before retries begin.",
        points: [
            "Deterministic ordering for production traffic",
            "Automatic failover on upstream error",
            "Bounded by per-key maxIterations",
        ],
    },
    {
        key: "priority",
        name: "Priority",
        title: "Treat explicit operator ranking as source of truth.",
        body: "Model selections can be ordered per API key to enforce exact first, second, and fallback attempts.",
        points: [
            "Matches drag-and-drop & keyboard priority order",
            "Predictable rollout across provider tiers",
            "Full visibility into active vs. standby order",
        ],
    },
    {
        key: "random",
        name: "Random",
        title: "Distribute requests without fixed bias.",
        body: "Random routing keeps the same exclusion and retry guarantees while sampling uniformly across eligible candidates.",
        points: [
            "Useful for comparative testing across providers",
            "Preserves per-request failure exclusion",
            "Same provider and vault key controls",
        ],
    },
];

const stackPanels = [
    {
        label: "Control",
        title: "Shape an API key as a routing policy.",
        body: "Each Roundhouse key stores its routing method, maxIterations ceiling, provider selections, and model priorities together.",
        lines: [
            "roundhouseMethod: EFFICIENCY",
            "maxIterations: 5",
            "providerSelections: 3",
        ],
    },
    {
        label: "Selection",
        title: "Bind providers and vault credentials explicitly.",
        body: "Global catalogs, custom OpenAI-compatible endpoints, and encrypted secrets stay visibly linked per selection.",
        lines: [
            "OpenAI / Anthropic / Gemini / Custom",
            "Vault keys attached per selection",
            "Active & inactive status flags",
        ],
    },
    {
        label: "Recovery",
        title: "Absorb upstream failures inside the retry loop.",
        body: "Failed model selections are excluded for the active cycle and reset only when the pool exhausts before maxIterations.",
        lines: [
            "Exclude failed selection",
            "Retry next candidate",
            "Reset pool on exhaustion",
        ],
    },
];

const workflow = [
    {
        title: "Store keys in the vault",
        body: "Add upstream provider credentials once. Secrets stay masked at rest and unlock in memory only on password confirmation.",
    },
    {
        title: "Configure a routing key",
        body: "Set routing method, maxIterations cap, provider selections, and active models on a dedicated Roundhouse API key.",
    },
    {
        title: "Point OpenAI clients at /v1",
        body: "Update your base URL and bearer token without rewriting application SDKs for every upstream provider.",
    },
    {
        title: "Monitor health & throughput",
        body: "Inspect per-model success counts, test live streams in Playground, and track platform analytics in the Admin Console.",
    },
];

const integrations = [
    {
        name: "OpenAI",
        detail: "Native wrapper compatibility preserving standard request and response shapes.",
    },
    {
        name: "Anthropic",
        detail: "Normalized through the same selection, priority, and retry pipeline.",
    },
    {
        name: "Gemini",
        detail: "Participates directly in shared efficiency, priority, and random pools.",
    },
    {
        name: "Custom endpoints",
        detail: "Private vLLM, Ollama, LM Studio, or proxy endpoints managed identically.",
    },
];

const reliabilityNotes = [
    "Single database load per request before retry iterations begin.",
    "In-memory exclusion isolates failed model selections inside the cycle.",
    "Hard termination at maxIterations prevents runaway retry loops.",
    "Consistent operational vocabulary across User Dashboard and Admin Console.",
];

const faqs = [
    {
        question: "What does Roundhouse route?",
        answer: "Roundhouse routes OpenAI-compatible requests through provider selections and model selections attached to a specific API key, executing deterministic retries within that pool.",
    },
    {
        question: "Do we need to rewrite our application SDKs?",
        answer: "No. Point existing OpenAI-compatible clients at the Roundhouse /v1 base URL with a Roundhouse bearer key.",
    },
    {
        question: "Can we combine global and private custom providers?",
        answer: "Yes. Custom providers share the same selection, vault key binding, and model priority controls as global providers.",
    },
    {
        question: "How are provider secrets protected in the console?",
        answer: "Vault keys remain masked by default. Unlocking requires your account password and clears decrypted values from memory after five minutes or on manual lock.",
    },
];

export function LandingPage() {
    const [activeMode, setActiveMode] = useState(routingModes[0].key);
    const [openFaq, setOpenFaq] = useState(faqs[0].question);
    const [activePanelKey, setActivePanelKey] = useState(stackPanels[0].label);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileMenuOpen]);

    const activeModePanel =
        routingModes.find((mode) => mode.key === activeMode) ?? routingModes[0];
    const activeStackPanel =
        stackPanels.find((panel) => panel.label === activePanelKey) ??
        stackPanels[0];

    const navLinks = [
        { href: "#architecture", label: "Architecture" },
        { href: "#showcase", label: "Workflow" },
        { href: "#integrations", label: "Integrations" },
        { href: "#security", label: "Reliability" },
        { href: routes.docs, label: "Docs" },
    ];

    return (
        <main className="w-full overflow-x-hidden bg-(--color-bg-primary) text-(--color-text-primary)">
            <header className="sticky top-0 z-40 border-b border-(--color-border-primary) bg-(--color-bg-secondary)">
                <div
                    className={cn(
                        shellClass,
                        "flex h-14 items-center justify-between gap-4",
                    )}
                >
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="Roundhouse"
                            width={28}
                            height={28}
                            className="rounded-sm border border-(--color-border-primary)"
                        />
                        <span className="text-sm font-semibold tracking-tight">
                            Roundhouse
                        </span>
                    </Link>

                    <nav
                        aria-label="Primary"
                        className="hidden items-center gap-6 text-sm text-(--color-text-secondary) lg:flex"
                    >
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="transition-colors hover:text-(--color-text-primary)"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <div
                            role="group"
                            aria-label="Color theme"
                            className="hidden rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) p-0.5 sm:flex"
                        >
                            {[
                                { value: "light", icon: SunIcon, label: "Light theme" },
                                { value: "dark", icon: MoonIcon, label: "Dark theme" },
                                { value: "system", icon: MonitorIcon, label: "System theme" },
                            ].map((item) => {
                                const Icon = item.icon;
                                const active = mounted && theme === item.value;
                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setTheme(item.value)}
                                        aria-pressed={active}
                                        aria-label={item.label}
                                        className={cn(
                                            "grid size-7 place-items-center rounded-sm text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                                            active &&
                                                "bg-(--color-bg-card) text-(--color-text-primary)",
                                        )}
                                    >
                                        <Icon size={14} />
                                    </button>
                                );
                            })}
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            <Link href={routes.login}>Sign in</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href={routes.dashboard}>
                                Console
                                <ArrowUpRightIcon size={15} />
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="lg:hidden"
                            aria-label="Open navigation menu"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <ListIcon size={18} />
                        </Button>
                    </div>
                </div>
            </header>

            {mobileMenuOpen ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site navigation"
                    className="fixed inset-0 z-50 bg-(--color-bg-overlay) lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        className="absolute inset-y-0 right-0 flex w-[min(84vw,300px)] flex-col justify-between border-l border-(--color-border-primary) bg-(--color-bg-secondary) p-4"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div>
                            <div className="flex items-center justify-between border-b border-(--color-border-subtle) pb-3">
                                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)">
                                    Navigation
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Close navigation menu"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <XIcon size={18} />
                                </Button>
                            </div>
                            <nav className="mt-4 grid gap-1">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-sm px-3 py-2 text-sm text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="grid gap-2 border-t border-(--color-border-subtle) pt-4">
                            <Button asChild variant="secondary">
                                <Link href={routes.login} onClick={() => setMobileMenuOpen(false)}>
                                    Sign in
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={routes.register} onClick={() => setMobileMenuOpen(false)}>
                                    Create workspace
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <section
                className={cn(
                    shellClass,
                    "grid gap-10 py-14 md:py-20 xl:grid-cols-[1.02fr_0.98fr] xl:items-start",
                )}
            >
                <div className="grid gap-6">
                    <div className="grid gap-4">
                        <h1 className="max-w-3xl text-3xl font-bold tracking-tight leading-[1.12] sm:text-5xl">
                            Route every AI request through one deterministic
                            control plane.
                        </h1>
                        <p className="max-w-[65ch] text-base leading-7 text-(--color-text-secondary)">
                            Roundhouse gives developers and operators one
                            workspace to manage provider selections, model
                            priorities, encrypted vault credentials, and bounded
                            retry loops across OpenAI, Anthropic, Gemini, and
                            custom endpoints.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                        <Button asChild size="lg">
                            <Link href={routes.register}>
                                Create workspace
                                <ArrowRightIcon size={16} />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary">
                            <Link href={routes.docs}>Read API docs</Link>
                        </Button>
                    </div>
                    <div className="grid gap-2.5 border-t border-(--color-border-subtle) pt-5 text-sm text-(--color-text-secondary) sm:grid-cols-2">
                        {[
                            "Unified /v1 request surface",
                            "Bounded retry & exclusion loop",
                            "Provider and model catalog in one UI",
                            "Separate Admin Console oversight",
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <CheckCircleIcon
                                    size={16}
                                    weight="fill"
                                    className="shrink-0 text-(--color-status-success)"
                                />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="min-w-0 overflow-hidden rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary)">
                    <div className="flex items-center justify-between border-b border-(--color-border-primary) px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-sm font-semibold text-(--color-text-primary)">
                                Production API Key
                            </h2>
                            <span className="font-mono text-[11px] text-(--color-text-muted)">
                                · Routing Profile
                            </span>
                        </div>
                        <span className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-card) px-2.5 py-0.5 font-mono text-[11px] font-medium">
                            EFFICIENCY
                        </span>
                    </div>

                    <div className="grid gap-px bg-(--color-border-primary) lg:grid-cols-2">
                        <div className="min-w-0 bg-(--color-bg-card) p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Candidate Pool
                                </p>
                                <CubeFocusIcon size={17} className="text-(--color-text-secondary)" />
                            </div>
                            <div className="mt-3 grid gap-2 font-mono text-xs">
                                {[
                                    ["gpt-4o-mini", "0.95"],
                                    ["claude-3.5-sonnet", "0.92"],
                                    ["gemini-1.5-pro", "0.88"],
                                ].map(([model, score]) => (
                                    <div
                                        key={model}
                                        className="flex items-center justify-between gap-2 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-3 py-2"
                                    >
                                        <span className="truncate text-(--color-text-primary)">{model}</span>
                                        <span className="shrink-0 text-(--color-text-muted)">{score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid min-w-0 gap-px bg-(--color-border-primary)">
                            <div className="min-w-0 bg-(--color-bg-card) p-4">
                                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Execution Sequence
                                </p>
                                <div className="mt-3 grid gap-1.5 font-mono text-xs">
                                    <div className="rounded-sm border border-[color-mix(in_srgb,var(--color-status-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-success)_10%,transparent)] px-3 py-2 text-(--color-status-success)">
                                        01 · OpenAI selection active
                                    </div>
                                    <div className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-3 py-2 text-(--color-text-secondary)">
                                        02 · Anthropic on standby
                                    </div>
                                    <div className="rounded-sm border border-dashed border-(--color-border-primary) px-3 py-2 text-(--color-text-muted)">
                                        03 · Gemini recovery fallback
                                    </div>
                                </div>
                            </div>
                            <div className="min-w-0 bg-(--color-bg-secondary) p-4">
                                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Request Contract
                                </p>
                                <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-6 text-(--color-text-secondary)">
{`POST /v1/chat/completions
Authorization: Bearer rh_live_xxx
strategy: priority | efficiency | random`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-(--color-border-primary) bg-(--color-bg-secondary)">
                <div
                    className={cn(
                        shellClass,
                        "grid grid-cols-2 gap-4 py-4 font-mono text-xs text-(--color-text-secondary) sm:grid-cols-3 lg:grid-cols-6",
                    )}
                >
                    {signalStrip.map((item) => (
                        <span key={item} className="truncate">
                            {item}
                        </span>
                    ))}
                </div>
            </section>

            <section id="architecture" className={cn(shellClass, "py-16 md:py-24")}>
                <div className="mb-10 grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        One routing control plane, built for visibility.
                    </h2>
                    <p className="max-w-[65ch] text-sm leading-7 text-(--color-text-secondary)">
                        Configure API-key-scoped routing, explicit provider
                        selections, ordered model pools, encrypted vault
                        credentials, and bounded retry limits in one surface.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    {architectureCards.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.title} className={cn("p-5", item.className)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold tracking-tight">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 font-mono text-[11px] text-(--color-text-muted)">
                                            {item.eyebrow}
                                        </p>
                                    </div>
                                    <div className="grid size-9 shrink-0 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) text-(--color-text-secondary)">
                                        <Icon size={18} />
                                    </div>
                                </div>
                                <p className="mt-3 max-w-[65ch] text-sm leading-6 text-(--color-text-secondary)">
                                    {item.body}
                                </p>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className={cn(shellClass, "border-t border-(--color-border-subtle) py-16 md:py-24")}>
                <div className="mb-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Three routing strategies, explicit tradeoffs.
                    </h2>
                    <p className="max-w-[65ch] text-sm leading-7 text-(--color-text-secondary)">
                        Switch per API key between Efficiency, Priority, and
                        Random selection while keeping bounded retry protection
                        intact.
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Routing modes">
                        {routingModes.map((mode) => {
                            const active = activeMode === mode.key;
                            return (
                                <button
                                    key={mode.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveMode(mode.key)}
                                    className={cn(
                                        "rounded-md border p-4 text-left transition-colors",
                                        active
                                            ? "border-(--color-border-focused) bg-(--color-bg-card)"
                                            : "border-(--color-border-primary) bg-(--color-bg-secondary) hover:bg-(--color-bg-card)",
                                    )}
                                >
                                    <h3 className="text-base font-semibold tracking-tight">
                                        {mode.name}: {mode.title}
                                    </h3>
                                </button>
                            );
                        })}
                    </div>

                    <Card className="p-6">
                        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight">
                                    {activeModePanel.name} Mode
                                </h3>
                                <p className="mt-2 max-w-[60ch] text-sm leading-6 text-(--color-text-secondary)">
                                    {activeModePanel.body}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                {activeModePanel.points.map((point) => (
                                    <div
                                        key={point}
                                        className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-4 py-2.5 text-sm text-(--color-text-secondary)"
                                    >
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            <section
                id="showcase"
                className="border-y border-(--color-border-primary) bg-(--color-bg-secondary)"
            >
                <div className={cn(shellClass, "py-16 md:py-24")}>
                    <div className="mb-10 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Store secrets. Shape keys. Bound retries.
                        </h2>
                        <p className="max-w-[65ch] text-sm leading-7 text-(--color-text-secondary)">
                            Inspect how each layer in Roundhouse connects—from
                            key policy to provider selection to failure
                            isolation.
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:items-start">
                        <div className="grid gap-2.5">
                            {stackPanels.map((panel) => {
                                const active = activePanelKey === panel.label;
                                return (
                                    <button
                                        key={panel.label}
                                        type="button"
                                        onClick={() => setActivePanelKey(panel.label)}
                                        className={cn(
                                            "rounded-md border p-4 text-left transition-colors",
                                            active
                                                ? "border-(--color-border-focused) bg-(--color-bg-card)"
                                                : "border-(--color-border-primary) bg-(--color-bg-primary) hover:bg-(--color-bg-card)",
                                        )}
                                    >
                                        <h3 className="text-base font-semibold tracking-tight">
                                            {panel.label}: {panel.title}
                                        </h3>
                                    </button>
                                );
                            })}
                        </div>

                        <Card className="bg-(--color-bg-primary) p-6">
                            <h3 className="text-2xl font-semibold tracking-tight">
                                {activeStackPanel.title}
                            </h3>
                            <p className="mt-2 max-w-[65ch] text-sm leading-6 text-(--color-text-secondary)">
                                {activeStackPanel.body}
                            </p>
                            <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                                {activeStackPanel.lines.map((line) => (
                                    <div
                                        key={line}
                                        className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-card) px-3 py-3 font-mono text-xs text-(--color-text-secondary)"
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            <section className={cn(shellClass, "py-16 md:py-24")}>
                <div className="mb-10">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        From vault setup to live routing.
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {workflow.map((item) => (
                        <Card key={item.title} className="bg-(--color-bg-secondary) p-5">
                            <h3 className="text-lg font-semibold tracking-tight">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                                {item.body}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            <section
                id="integrations"
                className="border-y border-(--color-border-primary) bg-(--color-bg-secondary)"
            >
                <div className={cn(shellClass, "py-16 md:py-24")}>
                    <div className="mb-10 grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Multi-provider coverage without sprawl.
                        </h2>
                        <p className="max-w-[65ch] text-sm leading-7 text-(--color-text-secondary)">
                            Connect managed global catalogs alongside private
                            endpoints using the same status, vault key, and
                            model priority workflow.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {integrations.map((item) => (
                            <Card key={item.name} className="bg-(--color-bg-primary) p-5">
                                <h3 className="text-lg font-semibold tracking-tight">
                                    {item.name}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                                    {item.detail}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section id="security" className={cn(shellClass, "py-16 md:py-24")}>
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <Card className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Secrets remain masked until explicitly unlocked.
                            </h2>
                            <ShieldCheckIcon size={24} className="shrink-0 text-(--color-status-success)" />
                        </div>
                        <div className="mt-5 grid gap-2">
                            {[
                                "Encrypted at rest, masked in all list responses",
                                "Password-gated reveal stored in memory only",
                                "Automatic 5-minute lock timer + instant manual lock",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-3.5 py-2.5 text-sm text-(--color-text-secondary)"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="grid gap-3">
                        {reliabilityNotes.map((item) => (
                            <Card key={item} className="bg-(--color-bg-secondary) p-4">
                                <p className="text-sm leading-6 text-(--color-text-secondary)">
                                    {item}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-(--color-border-primary) bg-(--color-bg-secondary)">
                <div className={cn(shellClass, "py-16 md:py-24")}>
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Common operational questions.
                        </h2>
                        <p className="mt-2 max-w-[65ch] text-sm text-(--color-text-secondary)">
                            Direct answers grounded in how Roundhouse routes
                            requests.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {faqs.map((item) => {
                            const open = openFaq === item.question;
                            return (
                                <button
                                    key={item.question}
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() =>
                                        setOpenFaq(open ? "" : item.question)
                                    }
                                    className={cn(
                                        "w-full rounded-md border p-5 text-left transition-colors",
                                        open
                                            ? "border-(--color-border-focused) bg-(--color-bg-primary)"
                                            : "border-(--color-border-primary) bg-(--color-bg-card) hover:bg-(--color-bg-card-hover)",
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-6">
                                        <h3 className="text-base font-semibold tracking-tight">
                                            {item.question}
                                        </h3>
                                        <span className="font-mono text-sm text-(--color-text-muted)">
                                            {open ? "−" : "+"}
                                        </span>
                                    </div>
                                    {open ? (
                                        <p className="mt-3 max-w-[62ch] text-sm leading-6 text-(--color-text-secondary)">
                                            {item.answer}
                                        </p>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className={cn(shellClass, "py-16 md:py-24")}>
                <Card className="p-6 sm:p-10">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-4xl">
                                Put provider routing, retries, and key security
                                inside one console.
                            </h2>
                            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-(--color-text-secondary)">
                                Launch a workspace, store provider secrets, and
                                test live failover in minutes.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button asChild size="lg">
                                    <Link href={routes.register}>
                                        Create workspace
                                        <ArrowRightIcon size={16} />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="secondary">
                                    <Link href={routes.docs}>
                                        Review documentation
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <Image
                                src="/logo_extra.png"
                                alt="Roundhouse architecture emblem"
                                width={240}
                                height={200}
                                className="h-44 w-auto rounded-md border border-(--color-border-primary) bg-(--color-bg-primary) object-contain p-3"
                            />
                        </div>
                    </div>
                </Card>
            </section>

            <footer className="border-t border-(--color-border-primary) bg-(--color-bg-secondary)">
                <div
                    className={cn(
                        shellClass,
                        "grid gap-8 py-8 lg:grid-cols-[1fr_auto]",
                    )}
                >
                    <div>
                        <div className="flex items-center gap-2.5">
                            <Image
                                src="/logo.png"
                                alt="Roundhouse"
                                width={28}
                                height={28}
                                className="rounded-sm border border-(--color-border-primary)"
                            />
                            <span className="text-sm font-semibold tracking-tight">
                                Roundhouse
                            </span>
                        </div>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-(--color-text-secondary)">
                            Unified API-key routing, provider catalog, and
                            encrypted vault management for multi-provider AI
                            workloads.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 text-sm text-(--color-text-secondary)">
                        <Link href={routes.dashboard} className="hover:text-(--color-text-primary)">
                            Dashboard
                        </Link>
                        <Link href={routes.login} className="hover:text-(--color-text-primary)">
                            Sign in
                        </Link>
                        <Link href={routes.register} className="hover:text-(--color-text-primary)">
                            Register
                        </Link>
                        <Link href={routes.docs} className="hover:text-(--color-text-primary)">
                            Docs
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
