"use client";

import Link from "next/link";
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CheckCircleIcon,
    CirclesThreePlusIcon,
    CodeBlockIcon,
    CubeFocusIcon,
    CursorClickIcon,
    GitBranchIcon,
    LockKeyIcon,
    ShieldCheckIcon,
    SparkleIcon,
    StackIcon,
    SwapIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";

gsap.registerPlugin(ScrollTrigger);

const shellClass = "mx-auto max-w-[1250px] px-4 lg:px-6";

const signalStrip = [
    "OpenAI-compatible surface",
    "Deterministic failover",
    "Vault-backed provider keys",
    "Global and custom providers",
    "Priority-aware model routing",
    "Admin analytics and oversight",
];

const marqueeSignals = [...signalStrip, ...signalStrip];

const architectureCards = [
    {
        title: "One endpoint for live traffic",
        body:
            "Roundhouse sits in front of provider APIs so existing OpenAI SDK flows can keep moving while routing decisions happen inside your control plane.",
        eyebrow: "/v1 compatibility",
        className: "xl:col-span-7",
        icon: CodeBlockIcon,
    },
    {
        title: "Provider selections stay explicit",
        body:
            "Each API key can attach provider selections, model selections, vault keys, and activation state without collapsing those decisions into hidden defaults.",
        eyebrow: "Configuration depth",
        className: "xl:col-span-5",
        icon: StackIcon,
    },
    {
        title: "Priority, efficiency, or random",
        body:
            "Routing method is stored per API key, so teams can decide whether traffic follows deterministic scoring, user-ranked priority, or randomized fallback.",
        eyebrow: "Per-key strategy",
        className: "md:col-span-6 xl:col-span-4",
        icon: GitBranchIcon,
    },
    {
        title: "Failure memory is part of the loop",
        body:
            "Failed model selections are excluded during the active request cycle, then recovered when the pool is exhausted so the system never stalls on one bad attempt.",
        eyebrow: "Roundhouse algorithm",
        className: "md:col-span-6 xl:col-span-4",
        icon: SwapIcon,
    },
    {
        title: "Custom providers belong in the same workspace",
        body:
            "User-created providers and admin-managed globals share the same operator language, making private endpoints feel first-class instead of bolted on.",
        eyebrow: "Shared inventory",
        className: "xl:col-span-8",
        icon: CirclesThreePlusIcon,
    },
    {
        title: "Key reveal stays temporary",
        body:
            "Vault keys are masked by default and only revealed in memory after password confirmation, which keeps credential work visible without leaving secrets exposed.",
        eyebrow: "Security posture",
        className: "xl:col-span-4",
        icon: LockKeyIcon,
    },
];

const routingModes = [
    {
        key: "efficiency",
        name: "Efficiency",
        title: "Send traffic to the best available model first.",
        body:
            "The Roundhouse core sorts the candidate pool once and prefers the strongest efficiency score before retries begin.",
        points: [
            "Best fit for stable production traffic",
            "Keeps model choice deterministic",
            "Pairs naturally with automatic failover",
        ],
    },
    {
        key: "priority",
        name: "Priority",
        title: "Treat operator ordering as the source of truth.",
        body:
            "Model selections can be ranked per API key so teams can intentionally control the first, second, and third attempt path.",
        points: [
            "Ideal for explicit rollout strategy",
            "Matches the drag-and-drop model ordering flow",
            "Useful when business rules outrank score heuristics",
        ],
    },
    {
        key: "random",
        name: "Random",
        title: "Distribute requests without hard preference bias.",
        body:
            "Random routing keeps the same configuration surface while removing a strict first-choice model from the loop.",
        points: [
            "Good for experimentation and load mixing",
            "Preserves fallback behavior",
            "Lets teams compare behavior across providers",
        ],
    },
];

const stackPanels = [
    {
        label: "Control",
        title: "Define one API key as an operational profile.",
        body:
            "A Roundhouse API key is more than a secret. It stores routing method, max iterations, provider selections, and model priorities in one place.",
        lines: ["roundhouseMethod: EFFICIENCY", "maxIterations: 5", "providerSelections: 3"],
    },
    {
        label: "Selection",
        title: "Attach providers and vault keys without losing context.",
        body:
            "Global providers, custom providers, and stored secrets stay grouped so operators can see exactly which credentials back each live path.",
        lines: [
            "OpenAI / Anthropic / Gemini / Custom",
            "Vault keys attached per selection",
            "Active and inactive states preserved",
        ],
    },
    {
        label: "Recovery",
        title: "Let the retry system absorb failures before your app does.",
        body:
            "Failed model selections are excluded during the request cycle, then the pool resets when exhaustion is reached so the loop keeps moving.",
        lines: ["Exclude failed selection", "Retry remaining candidates", "Recover exhausted pool"],
    },
];

const workflow = [
    {
        step: "01",
        title: "Store provider credentials in the vault",
        body:
            "Teams add encrypted provider keys once, keep them masked by default, and reveal them only through the password-gated unlock flow.",
    },
    {
        step: "02",
        title: "Shape an API key around live routing intent",
        body:
            "Every Roundhouse key gets its own routing method, retry ceiling, provider selections, and model inventory.",
    },
    {
        step: "03",
        title: "Send familiar OpenAI-style requests",
        body:
            "Existing clients can point at the Roundhouse endpoint instead of rewriting application code around each provider.",
    },
    {
        step: "04",
        title: "Watch the control plane explain what happened",
        body:
            "Dashboards surface model counts, provider health, request success, and admin-wide throughput so ops decisions stay observable.",
    },
];

const integrations = [
    {
        name: "OpenAI",
        detail: "Fits the native wrapper model and keeps the API surface familiar.",
    },
    {
        name: "Anthropic",
        detail: "Runs through the same normalized request and response pipeline.",
    },
    {
        name: "Gemini",
        detail: "Participates in the shared routing pool without a parallel dashboard.",
    },
    {
        name: "Custom endpoints",
        detail: "User-owned providers extend the same provider, model, and status patterns.",
    },
];

const reliabilityNotes = [
    "DB state is loaded once per request before retries begin.",
    "Failure memory excludes broken model selections inside the active loop.",
    "Termination is bounded by maxIterations, so the process cannot run forever.",
    "Admin and user workspaces share the same operational vocabulary for faster diagnosis.",
];

const faqs = [
    {
        question: "What is Roundhouse actually routing?",
        answer:
            "It routes OpenAI-compatible requests through provider selections and model selections attached to a specific API key, then handles retries inside that configured pool.",
    },
    {
        question: "Do teams need to rebuild their application clients?",
        answer:
            "No. The platform is designed around an OpenAI-compatible surface, so the primary shift is base URL and credential handling rather than a full SDK migration.",
    },
    {
        question: "Can one team mix global and private providers?",
        answer:
            "Yes. The dashboard already separates user-created providers from global inventory while preserving a single selection workflow for API keys.",
    },
    {
        question: "How are secrets handled on the frontend?",
        answer:
            "Vault entries stay masked by default. Reveal flows are password-gated and the unlocked values are intended to live only in memory until they are locked again.",
    },
];

export function LandingPage() {
    const [activeMode, setActiveMode] = useState(routingModes[0].key);
    const [openFaq, setOpenFaq] = useState(faqs[0].question);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) {
            gsap.set("[data-reveal]", { opacity: 1, y: 0 });
            return;
        }

        const ctx = gsap.context(() => {
            gsap.set("[data-reveal]", { opacity: 0, y: 42 });

            ScrollTrigger.batch("[data-reveal]", {
                start: "top 84%",
                onEnter: (batch) =>
                    gsap.to(batch, {
                        opacity: 1,
                        y: 0,
                        duration: 0.9,
                        stagger: 0.1,
                        ease: "power3.out",
                        overwrite: true,
                    }),
            });

            gsap.utils.toArray<HTMLElement>("[data-media-scale]").forEach((item) => {
                gsap.fromTo(
                    item,
                    { scale: 1.04, opacity: 0.78 },
                    {
                        scale: 1,
                        opacity: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: item,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: 1,
                        },
                    },
                );
            });

            const mm = gsap.matchMedia();

            mm.add("(min-width: 1024px)", () => {
                const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
                if (!cards.length) return;

                cards.forEach((card, index) => {
                    gsap.set(card, {
                        y: index * 26,
                        scale: 1 - index * 0.04,
                        opacity: 1 - index * 0.08,
                        transformOrigin: "center top",
                    });
                });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: "[data-story-pin]",
                        start: "top top",
                        end: `+=${cards.length * 320}`,
                        pin: true,
                        scrub: 1,
                    },
                });

                cards.slice(1).forEach((card, index) => {
                    tl.to(
                        cards[index],
                        {
                            y: -88,
                            scale: 0.92,
                            opacity: 0.2,
                            ease: "none",
                        },
                        index,
                    ).to(
                        card,
                        {
                            y: 0,
                            scale: 1,
                            opacity: 1,
                            ease: "none",
                        },
                        index,
                    );
                });
            });

            const disposers: Array<() => void> = [];
            gsap.utils.toArray<HTMLElement>("[data-hover-float]").forEach((item) => {
                const moveX = gsap.quickTo(item, "x", { duration: 0.45, ease: "power3.out" });
                const moveY = gsap.quickTo(item, "y", { duration: 0.45, ease: "power3.out" });
                const rotate = gsap.quickTo(item, "rotation", { duration: 0.45, ease: "power3.out" });

                const handleMove = (event: PointerEvent) => {
                    const bounds = item.getBoundingClientRect();
                    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
                    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
                    moveX(x);
                    moveY(y);
                    rotate(x * 0.35);
                };

                const handleLeave = () => {
                    moveX(0);
                    moveY(0);
                    rotate(0);
                };

                item.addEventListener("pointermove", handleMove);
                item.addEventListener("pointerleave", handleLeave);

                disposers.push(() => {
                    item.removeEventListener("pointermove", handleMove);
                    item.removeEventListener("pointerleave", handleLeave);
                });
            });

            return () => {
                disposers.forEach((dispose) => dispose());
                mm.revert();
            };
        });

        return () => {
            ctx.revert();
        };
    }, []);

    const activeModePanel = routingModes.find((mode) => mode.key === activeMode) ?? routingModes[0];

    return (
        <main
            className="overflow-x-hidden w-full max-w-full"
            style={{ fontFamily: '"Geist", "Ubuntu", system-ui, sans-serif' }}
        >
            <div className="relative isolate bg-(--color-bg-primary) text-(--color-text-primary)">
                <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent-primary)_18%,transparent),transparent_58%)]" />
                <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_55%,transparent),transparent)]" />

                <header className="sticky top-0 z-40 border-b border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_86%,transparent)] backdrop-blur-xl">
                    <div className={cn(shellClass, "flex items-center justify-between gap-6 py-4")}>
                        <Link href="/" className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-2xl border border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_95%,transparent),color-mix(in_srgb,var(--color-bg-card)_82%,transparent))] text-lg font-semibold tracking-tight">
                                R
                            </span>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.26em] text-(--color-text-muted)">
                                    Roundhouse
                                </div>
                                <div className="text-sm text-(--color-text-secondary)">AI routing control plane</div>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-6 text-sm text-(--color-text-secondary) lg:flex">
                            <Link href="#architecture" className="transition-colors hover:text-(--color-text-primary)">
                                Architecture
                            </Link>
                            <Link href="#showcase" className="transition-colors hover:text-(--color-text-primary)">
                                Showcase
                            </Link>
                            <Link href="#integrations" className="transition-colors hover:text-(--color-text-primary)">
                                Integrations
                            </Link>
                            <Link href="#security" className="transition-colors hover:text-(--color-text-primary)">
                                Reliability
                            </Link>
                            <Link href={routes.docs} className="transition-colors hover:text-(--color-text-primary)">
                                Docs
                            </Link>
                        </nav>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                <Link href={routes.login}>Sign in</Link>
                            </Button>
                            <Button asChild>
                                <Link href={routes.dashboard}>
                                    Enter dashboard
                                    <ArrowUpRightIcon size={18} />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <section className={cn(shellClass, "grid gap-14 py-24 md:py-32 xl:grid-cols-[1.02fr_0.98fr] xl:items-end")}>
                    <div className="grid gap-8" data-reveal>
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">
                            <span className="inline-block h-px w-12 bg-(--color-border-primary)" />
                            OpenAI-compatible orchestration
                        </div>
                        <div className="grid gap-6">
                            <h1 className="max-w-6xl text-5xl font-semibold tracking-tight leading-none text-balance sm:text-6xl lg:text-7xl">
                                Route every AI request through one control plane built for failover.
                            </h1>
                            <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary) sm:text-lg">
                                Roundhouse gives developers and operators one place to shape provider selections, model
                                priorities, vault-backed credentials, and retry behavior before live traffic hits
                                OpenAI, Anthropic, Gemini, or a custom endpoint.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="px-6">
                                <Link href={routes.register}>
                                    Create workspace
                                    <ArrowRightIcon size={18} />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="secondary" className="px-6">
                                <Link href={routes.docs}>Read API docs</Link>
                            </Button>
                        </div>
                        <div className="grid gap-3 text-sm text-(--color-text-secondary) sm:grid-cols-2">
                            {[
                                "Unified /v1 request surface",
                                "Deterministic retry boundaries",
                                "Provider and model inventory in one UI",
                                "Admin-wide visibility when teams scale",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <CheckCircleIcon size={18} weight="fill" className="text-(--color-status-success)" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative" data-reveal data-media-scale data-hover-float>
                        <div className="absolute -left-4 top-10 rounded-full border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_82%,transparent)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-(--color-text-secondary) shadow-[0_20px_80px_-48px_var(--color-shadow)] backdrop-blur-xl sm:-left-8">
                            Provider vault linked
                        </div>
                        <div className="absolute -right-3 bottom-16 rounded-full border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_82%,transparent)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-(--color-text-secondary) shadow-[0_20px_80px_-48px_var(--color-shadow)] backdrop-blur-xl sm:-right-8">
                            Retry loop active
                        </div>

                        <div className="overflow-hidden rounded-[2rem] border border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_96%,transparent),color-mix(in_srgb,var(--color-bg-card)_92%,transparent))] p-5 shadow-[0_40px_120px_-64px_var(--color-shadow)]">
                            <div className="mb-5 flex items-center justify-between border-b border-(--color-border-primary) pb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">
                                        Live routing profile
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Production API Key</h2>
                                </div>
                                <span className="rounded-full border border-(--color-border-primary) px-3 py-1 text-xs text-(--color-text-secondary)">
                                    EFFICIENCY
                                </span>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                                <Card className="rounded-[1.5rem] border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_38%,transparent)] p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                                                Candidate pool
                                            </p>
                                            <p className="mt-2 text-lg font-medium tracking-tight">
                                                Sorted before the first retry
                                            </p>
                                        </div>
                                        <CubeFocusIcon size={28} className="text-(--color-accent-primary)" />
                                    </div>
                                    <div className="mt-5 grid gap-3">
                                        {[
                                            "gpt-4o-mini -> score 0.95",
                                            "claude-3.5-sonnet -> score 0.92",
                                            "gemini-1.5-pro -> score 0.88",
                                        ].map((line) => (
                                            <div
                                                key={line}
                                                className="rounded-2xl border border-(--color-border-primary) bg-(--color-bg-card) px-4 py-3 text-sm text-(--color-text-secondary)"
                                            >
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="grid gap-4">
                                    <Card className="rounded-[1.5rem] border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_34%,transparent)] p-5">
                                        <p className="text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                                            Current path
                                        </p>
                                        <div className="mt-4 grid gap-2">
                                            {[
                                                "1. OpenAI selection active",
                                                "2. Anthropic on standby",
                                                "3. Gemini ready if pool resets",
                                            ].map((item, index) => (
                                                <div
                                                    key={item}
                                                    className={cn(
                                                        "rounded-2xl px-4 py-3 text-sm",
                                                        index === 0
                                                            ? "bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)]"
                                                            : "bg-(--color-bg-card) text-(--color-text-secondary)",
                                                    )}
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="rounded-[1.5rem] border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_34%,transparent)] p-5">
                                        <p className="text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                                            Request notes
                                        </p>
                                        <code className="mt-3 block rounded-2xl border border-(--color-border-primary) bg-(--color-bg-card) p-4 text-sm leading-7 text-(--color-text-secondary)">
                                            POST /v1/chat/completions{"\n"}
                                            Authorization: Bearer rh_live_xxx{"\n"}
                                            strategy: priority | efficiency | random
                                        </code>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_48%,transparent)]">
                    <div className={cn(shellClass, "overflow-hidden py-6")}>
                        <div className="marquee-fade relative overflow-hidden">
                            <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap text-sm uppercase tracking-[0.24em] text-(--color-text-muted)">
                                {marqueeSignals.map((item, index) => (
                                    <span key={`${item}-${index}`} className="shrink-0">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="architecture" className={cn(shellClass, "py-24 md:py-32")}>
                    <div className="mb-12 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
                        <div data-reveal>
                            <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Product architecture</p>
                            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                The dashboard is already a control plane. The homepage should explain it like one.
                            </h2>
                        </div>
                        <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                            Roundhouse is not selling abstract AI promises. It is exposing the real system already inside the
                            product: API-key-scoped routing, provider selection, model ordering, vault management, and a retry
                            algorithm designed to keep traffic moving.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {architectureCards.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Card
                                    key={item.title}
                                    className={cn(
                                        "rounded-[1.75rem] border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_98%,transparent),color-mix(in_srgb,var(--color-bg-card)_92%,transparent))] p-6 shadow-[0_28px_80px_-56px_var(--color-shadow)]",
                                        item.className,
                                    )}
                                    data-reveal
                                    data-hover-float
                                >
                                    <div className="flex flex-col gap-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">
                                                    {item.eyebrow}
                                                </p>
                                                <h3 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)] text-(--color-accent-primary)">
                                                <Icon size={24} />
                                            </div>
                                        </div>
                                        <p className="max-w-2xl text-sm leading-7 text-(--color-text-secondary)">{item.body}</p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                <section className={cn(shellClass, "pb-24 md:pb-32")}>
                    <div className="mb-10 grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
                        <div data-reveal>
                            <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Routing systems</p>
                            <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                Three routing modes, one operator language.
                            </h2>
                        </div>
                        <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                            The dashboard already exposes RANDOM, EFFICIENCY, and PRIORITY. Instead of hiding that
                            complexity, the landing page turns each mode into a clear decision with operational tradeoffs.
                        </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
                        <div className="grid gap-4">
                            {routingModes.map((mode) => {
                                const active = activeMode === mode.key;
                                return (
                                    <button
                                        key={mode.key}
                                        type="button"
                                        onMouseEnter={() => setActiveMode(mode.key)}
                                        onFocus={() => setActiveMode(mode.key)}
                                        onClick={() => setActiveMode(mode.key)}
                                        className={cn(
                                            "rounded-[1.5rem] border border-(--color-border-primary) p-5 text-left transition-all duration-300",
                                            active
                                                ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent-primary)_10%,var(--color-bg-secondary)),color-mix(in_srgb,var(--color-bg-card)_92%,transparent))] shadow-[0_24px_72px_-48px_var(--color-shadow)]"
                                                : "bg-(--color-bg-secondary)",
                                        )}
                                        data-reveal
                                    >
                                        <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">{mode.name}</p>
                                        <h3 className="mt-3 text-xl font-semibold tracking-tight">{mode.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-(--color-text-secondary)">{mode.body}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <Card
                            className="rounded-[1.75rem] border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_98%,transparent),var(--color-bg-card))] p-6 xl:p-8"
                            data-reveal
                            data-hover-float
                        >
                            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">Active mode</p>
                                    <h3 className="mt-4 text-3xl font-semibold tracking-tight">{activeModePanel.name}</h3>
                                    <p className="mt-4 max-w-xl text-sm leading-7 text-(--color-text-secondary)">
                                        {activeModePanel.body}
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    {activeModePanel.points.map((point) => (
                                        <div
                                            key={point}
                                            className="rounded-2xl border border-(--color-border-primary) bg-(--color-bg-secondary) px-4 py-4 text-sm text-(--color-text-secondary)"
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
                    className="border-y border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_42%,transparent)]"
                >
                    <div className={cn(shellClass, "py-24 md:py-32")}>
                        <div className="mb-12 grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
                            <div data-reveal>
                                <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Product showcase</p>
                                <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                    A premium front door for the same operational depth inside the app.
                                </h2>
                            </div>
                            <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                                The strongest story in this product is sequence. Store secrets. Build a routing key. Attach
                                providers. Let the retry engine protect the request path.
                            </p>
                        </div>

                        <div className="grid gap-10 lg:grid-cols-[0.58fr_1.42fr] lg:items-start" data-story-pin>
                            <div className="grid gap-4 lg:pt-6" data-reveal>
                                {stackPanels.map((panel) => (
                                    <div
                                        key={panel.label}
                                        className="rounded-[1.5rem] border border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_96%,transparent),var(--color-bg-card))] p-5"
                                    >
                                        <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">{panel.label}</p>
                                        <h3 className="mt-3 text-xl font-semibold tracking-tight">{panel.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-(--color-text-secondary)">{panel.body}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="relative min-h-[34rem] rounded-[2rem] border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_72%,transparent)] p-3 lg:min-h-[42rem]">
                                {stackPanels.map((panel) => (
                                    <Card
                                        key={panel.title}
                                        className="absolute inset-3 rounded-[1.6rem] border-(--color-border-primary) bg-[linear-gradient(180deg,var(--color-bg-secondary),var(--color-bg-card))] p-6 shadow-[0_40px_120px_-72px_var(--color-shadow)]"
                                        data-stack-card
                                    >
                                        <div className="flex h-full flex-col justify-between gap-10">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">{panel.label}</p>
                                                <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                                    {panel.title}
                                                </h3>
                                                <p className="mt-4 max-w-2xl text-sm leading-8 text-(--color-text-secondary)">
                                                    {panel.body}
                                                </p>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {panel.lines.map((line) => (
                                                    <div
                                                        key={line}
                                                        className="rounded-2xl border border-(--color-border-primary) bg-(--color-bg-secondary) px-4 py-4 text-sm text-(--color-text-secondary)"
                                                    >
                                                        {line}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                                                <div className="rounded-[1.5rem] border border-(--color-border-primary) bg-(--color-bg-secondary) p-5">
                                                    <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">Operator view</p>
                                                    <div className="mt-4 grid gap-3">
                                                        {["Provider status", "Model ordering", "Vault key attachment"].map((item) => (
                                                            <div
                                                                key={item}
                                                                className="flex items-center justify-between rounded-2xl bg-(--color-bg-card) px-4 py-3 text-sm"
                                                            >
                                                                <span>{item}</span>
                                                                <span className="text-(--color-accent-primary)">visible</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-[1.5rem] border border-(--color-border-primary) bg-(--color-bg-secondary) p-5">
                                                    <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">Runtime notes</p>
                                                    <div className="mt-4 space-y-3 font-mono text-sm leading-7 text-(--color-text-secondary)">
                                                        <div>load candidate pool once</div>
                                                        <div>exclude failure</div>
                                                        <div>retry until success or maxIterations</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={cn(shellClass, "py-24 md:py-32")}>
                    <div className="mb-12 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <div data-reveal>
                            <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Workflow</p>
                            <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                From secret storage to failover, the path stays legible.
                            </h2>
                        </div>
                        <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                            This is where the product stands apart from a simple API proxy. The workflow is configurable
                            enough for teams, but every step still maps cleanly to a dashboard object the operator can inspect later.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {workflow.map((item) => (
                            <Card
                                key={item.step}
                                className="rounded-[1.75rem] border-(--color-border-primary) bg-(--color-bg-secondary) p-6"
                                data-reveal
                                data-hover-float
                            >
                                <p className="text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">Step {item.step}</p>
                                <h3 className="mt-4 text-2xl font-semibold tracking-tight">{item.title}</h3>
                                <p className="mt-4 text-sm leading-7 text-(--color-text-secondary)">{item.body}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                <section
                    id="integrations"
                    className="border-y border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_42%,transparent)]"
                >
                    <div className={cn(shellClass, "py-24 md:py-32")}>
                        <div className="mb-12 grid gap-4 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
                            <div data-reveal>
                                <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Integrations</p>
                                <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                    Built around provider diversity, not provider sprawl.
                                </h2>
                            </div>
                            <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                                First-class provider types already exist in the product model, and custom providers use the
                                same language as the built-in catalog so teams can extend the platform without fracturing the UI.
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {integrations.map((item) => (
                                    <Card
                                        key={item.name}
                                        className="rounded-[1.75rem] border-(--color-border-primary) bg-(--color-bg-secondary) p-6"
                                        data-reveal
                                        data-hover-float
                                    >
                                        <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">Provider</p>
                                        <h3 className="mt-4 text-2xl font-semibold tracking-tight">{item.name}</h3>
                                        <p className="mt-3 text-sm leading-7 text-(--color-text-secondary)">{item.detail}</p>
                                    </Card>
                                ))}
                            </div>

                            <Card
                                className="rounded-[1.75rem] border-(--color-border-primary) bg-[linear-gradient(180deg,var(--color-bg-secondary),var(--color-bg-card))] p-6 xl:p-8"
                                data-reveal
                                data-media-scale
                            >
                                <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">API compatibility</p>
                                <h3 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight">
                                    Existing OpenAI request shapes stay usable while routing gets smarter behind the edge.
                                </h3>
                                <div className="mt-8 rounded-[1.5rem] border border-(--color-border-primary) bg-(--color-bg-card) p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-sm font-medium">Normalized request flow</span>
                                        <CursorClickIcon size={20} className="text-(--color-accent-primary)" />
                                    </div>
                                    <div className="space-y-3 text-sm text-(--color-text-secondary)">
                                        {[
                                            "App request -> OpenAI-compatible payload",
                                            "Roundhouse wrapper -> provider normalization",
                                            "Response -> OpenAI-compatible output",
                                        ].map((item) => (
                                            <div
                                                key={item}
                                                className="rounded-2xl bg-(--color-bg-secondary) px-4 py-3"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                <section id="security" className={cn(shellClass, "py-24 md:py-32")}>
                    <div className="mb-12 grid gap-4 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
                        <div data-reveal>
                            <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">
                                Security and reliability
                            </p>
                            <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                The product&apos;s strongest claims are operational, so the proof should read that way too.
                            </h2>
                        </div>
                        <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                            The repository already documents the critical guarantees: bounded retries, in-memory failure
                            isolation, and explicit secret handling. The homepage keeps those assurances readable without reducing
                            them to vague trust language.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <Card
                            className="rounded-[1.75rem] border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_96%,transparent),color-mix(in_srgb,var(--color-bg-card)_92%,transparent))] p-6"
                            data-reveal
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-(--color-text-muted)">Vault discipline</p>
                                    <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                                        Secrets stay masked until an operator deliberately unlocks them.
                                    </h3>
                                </div>
                                <ShieldCheckIcon size={30} className="text-(--color-accent-primary)" />
                            </div>
                            <div className="mt-8 grid gap-3">
                                {["Masked by default", "Password-gated reveal", "Lock clears memory state"].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-2xl border border-(--color-border-primary) bg-(--color-bg-card) px-4 py-3 text-sm text-(--color-text-secondary)"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="grid gap-4">
                            {reliabilityNotes.map((item) => (
                                <Card
                                    key={item}
                                    className="rounded-[1.5rem] border-(--color-border-primary) bg-(--color-bg-secondary) p-5"
                                    data-reveal
                                    data-hover-float
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)] text-(--color-accent-primary)">
                                            <SparkleIcon size={18} />
                                        </div>
                                        <p className="text-sm leading-7 text-(--color-text-secondary)">{item}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-secondary)_46%,transparent)]">
                    <div className={cn(shellClass, "py-24 md:py-32")}>
                        <div className="mb-12 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                            <div data-reveal>
                                <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">FAQ</p>
                                <h2 className="mt-4 text-4xl font-semibold tracking-tight leading-none sm:text-5xl">
                                    Questions teams ask before they trust a routing layer.
                                </h2>
                            </div>
                            <p className="max-w-3xl text-base leading-8 text-(--color-text-secondary)" data-reveal>
                                The answers here are shaped by the current repository, not by generic homepage filler.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {faqs.map((item) => {
                                const open = openFaq === item.question;
                                return (
                                    <button
                                        key={item.question}
                                        type="button"
                                        onClick={() => setOpenFaq(open ? "" : item.question)}
                                        className={cn(
                                            "w-full rounded-[1.75rem] border border-(--color-border-primary) px-6 py-5 text-left transition-colors",
                                            open ? "bg-(--color-bg-secondary)" : "bg-transparent",
                                        )}
                                        data-reveal
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <h3 className="text-xl font-semibold tracking-tight">{item.question}</h3>
                                            <span className="text-(--color-text-muted)">{open ? "-" : "+"}</span>
                                        </div>
                                        <div
                                            className="overflow-hidden transition-[max-height,opacity] duration-300"
                                            style={{
                                                maxHeight: open ? "220px" : "0px",
                                                opacity: open ? 1 : 0,
                                            }}
                                        >
                                            <div className="pt-4 text-sm leading-7 text-(--color-text-secondary)">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className={cn(shellClass, "py-24 md:py-32")}>
                    <Card
                        className="overflow-hidden rounded-[2rem] border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-secondary)_98%,transparent),color-mix(in_srgb,var(--color-bg-card)_92%,transparent))] px-6 py-10 shadow-[0_40px_120px_-70px_var(--color-shadow)] sm:px-10 sm:py-12"
                        data-reveal
                        data-media-scale
                    >
                        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                            <div>
                                <p className="text-sm uppercase tracking-[0.28em] text-(--color-text-muted)">Massive call to action</p>
                                <h2 className="mt-4 max-w-4xl text-[2rem] font-semibold tracking-tight leading-none sm:text-[2.6rem] lg:text-[3.2rem]">
                                    Put your provider inventory, retry logic, and key security behind one deliberate front door.
                                </h2>
                                <p className="mt-6 max-w-3xl text-base leading-8 text-(--color-text-secondary)">
                                    Launch a workspace, connect the providers you already use, and give your team a control
                                    plane that explains how routing decisions are made before production traffic scales.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <Button asChild size="lg" className="min-h-12 px-6">
                                    <Link href={routes.register}>
                                        Create workspace
                                        <ArrowRightIcon size={18} />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="secondary" className="min-h-12 px-6">
                                    <Link href={routes.docs}>Review documentation</Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                <footer className="border-t border-(--color-border-primary)">
                    <div className={cn(shellClass, "grid gap-10 py-10 lg:grid-cols-[1fr_auto]")}>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="grid size-11 place-items-center rounded-2xl border border-(--color-border-primary) bg-(--color-bg-secondary) text-lg font-semibold">
                                    R
                                </span>
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.26em] text-(--color-text-muted)">
                                        Roundhouse
                                    </p>
                                    <p className="text-sm text-(--color-text-secondary)">
                                        AI service orchestration with visible routing logic.
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-(--color-text-secondary)">
                                Built around the same user dashboard, admin analytics, provider catalog, and vault system
                                already present in the product. No placeholder pricing. No speculative feature claims.
                            </p>
                        </div>

                        <div className="grid gap-3 text-sm text-(--color-text-secondary)">
                            <Link href={routes.dashboard} className="transition-colors hover:text-(--color-text-primary)">
                                Dashboard
                            </Link>
                            <Link href={routes.login} className="transition-colors hover:text-(--color-text-primary)">
                                Sign in
                            </Link>
                            <Link href={routes.register} className="transition-colors hover:text-(--color-text-primary)">
                                Register
                            </Link>
                            <Link href={routes.docs} className="transition-colors hover:text-(--color-text-primary)">
                                Docs
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}
