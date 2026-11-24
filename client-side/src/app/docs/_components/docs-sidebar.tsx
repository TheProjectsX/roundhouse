"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ArrowLeftIcon,
    BooksIcon,
    BracketsCurlyIcon,
    CpuIcon,
    KeyIcon,
    ListIcon,
    LockIcon,
    MagnifyingGlassIcon,
    MonitorIcon,
    MoonIcon,
    PlugIcon,
    RocketLaunchIcon,
    ShieldCheckIcon,
    ShuffleAngularIcon,
    SparkleIcon,
    StackIcon,
    SunIcon,
    WarningCircleIcon,
    XIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";
import { docsCategories, docsNavigation, type DocNavItem } from "../docs-config";

const iconMap: Record<DocNavItem["icon"], typeof SparkleIcon> = {
    sparkle: SparkleIcon,
    rocket: RocketLaunchIcon,
    lock: LockIcon,
    key: KeyIcon,
    stack: StackIcon,
    vault: BooksIcon,
    cpu: CpuIcon,
    brackets: BracketsCurlyIcon,
    plug: PlugIcon,
    shuffle: ShuffleAngularIcon,
    warning: WarningCircleIcon,
    shield: ShieldCheckIcon,
};

function SidebarLinks({
    pathname,
    query,
    onNavigate,
}: {
    pathname: string;
    query: string;
    onNavigate?: () => void;
}) {
    const normalized = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        if (!normalized) return docsNavigation;
        return docsNavigation.filter(
            (item) =>
                item.title.toLowerCase().includes(normalized) ||
                item.description.toLowerCase().includes(normalized) ||
                item.category.toLowerCase().includes(normalized),
        );
    }, [normalized]);

    if (filtered.length === 0) {
        return (
            <p className="rounded-sm border border-dashed border-(--color-border-primary) px-3 py-6 text-center text-xs text-(--color-text-muted)">
                No docs match &ldquo;{query}&rdquo;.
            </p>
        );
    }

    return (
        <div className="grid gap-5">
            {docsCategories.map((category) => {
                const items = filtered.filter((item) => item.category === category);
                if (items.length === 0) return null;

                return (
                    <div key={category}>
                        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                            {category}
                        </p>
                        <div className="grid gap-0.5">
                            {items.map((item) => {
                                const Icon = iconMap[item.icon];
                                const active = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "group flex items-center gap-2.5 rounded-sm border border-transparent px-2.5 py-2 text-sm transition-colors",
                                            active
                                                ? "border-(--color-border-primary) bg-(--color-bg-card) font-medium text-(--color-text-primary)"
                                                : "text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                                        )}
                                    >
                                        <Icon
                                            size={16}
                                            weight={active ? "bold" : "regular"}
                                            className={cn(
                                                "shrink-0 transition-colors",
                                                active
                                                    ? "text-(--color-text-primary)"
                                                    : "text-(--color-text-muted) group-hover:text-(--color-text-primary)",
                                            )}
                                        />
                                        <span className="truncate">{item.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function DocsSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const current = useMemo(
        () => docsNavigation.find((item) => item.href === pathname) ?? docsNavigation[0],
        [pathname],
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const searchInput = (
        <div className="relative mb-4">
            <MagnifyingGlassIcon
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
            />
            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter docs..."
                aria-label="Filter documentation"
                className="h-9 w-full rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) pl-9 pr-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-border-focused) focus:outline-none"
            />
        </div>
    );

    const headerControls = (
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-(--color-border-subtle) pb-3">
            <h2 className="text-base font-semibold text-(--color-text-primary)">Documentation</h2>
            <div className="flex items-center gap-1">
                <Link
                    href={routes.dashboard}
                    className="inline-flex items-center gap-1 rounded-sm border border-(--color-border-primary) px-2 py-1 text-xs text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                >
                    <ArrowLeftIcon size={12} />
                    Console
                </Link>
            </div>
        </div>
    );

    const themeBar = (
        <div className="mt-5 flex items-center justify-between border-t border-(--color-border-subtle) pt-3">
            <Link href="/" className="text-xs text-(--color-text-secondary) hover:text-(--color-text-primary)">
                Home
            </Link>
            <div role="group" aria-label="Color theme" className="flex rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) p-0.5">
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
                                active && "bg-(--color-bg-card) text-(--color-text-primary)",
                            )}
                        >
                            <Icon size={14} />
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <div className="flex items-center justify-between rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) px-4 py-3 lg:hidden">
                <div className="min-w-0">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                        {current.category}
                    </p>
                    <p className="truncate text-sm font-semibold text-(--color-text-primary)">{current.title}</p>
                </div>
                <Button variant="secondary" size="icon" onClick={() => setOpen(true)} aria-label="Open docs navigation">
                    <ListIcon size={18} />
                </Button>
            </div>

            <aside className="sticky top-6 hidden max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-4 lg:block">
                {headerControls}
                {searchInput}
                <SidebarLinks pathname={pathname} query={query} />
                {themeBar}
            </aside>

            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Documentation navigation"
                    className="fixed inset-0 z-50 bg-(--color-bg-overlay) lg:hidden"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="absolute inset-y-0 left-0 w-[min(86vw,320px)] overflow-y-auto border-r border-(--color-border-primary) bg-(--color-bg-secondary) p-4"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between border-b border-(--color-border-subtle) pb-3">
                            <h2 className="text-base font-semibold text-(--color-text-primary)">Documentation</h2>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close docs navigation">
                                <XIcon size={18} />
                            </Button>
                        </div>
                        {searchInput}
                        <SidebarLinks pathname={pathname} query={query} onNavigate={() => setOpen(false)} />
                        {themeBar}
                    </div>
                </div>
            ) : null}
        </>
    );
}
