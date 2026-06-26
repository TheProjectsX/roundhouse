"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BooksIcon,
    BracketsCurlyIcon,
    CpuIcon,
    KeyIcon,
    ListIcon,
    LockIcon,
    PlugIcon,
    RocketLaunchIcon,
    ShieldCheckIcon,
    ShuffleAngularIcon,
    SparkleIcon,
    StackIcon,
    WarningCircleIcon,
    XIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
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
    onNavigate,
}: {
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <div className="grid gap-6">
            {docsCategories.map((category) => (
                <div key={category}>
                    <p className="mb-3 text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">{category}</p>
                    <div className="grid gap-1.5">
                        {docsNavigation
                            .filter((item) => item.category === category)
                            .map((item) => {
                                const Icon = iconMap[item.icon];
                                const active = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "group rounded-xl border px-3 py-3 transition-colors",
                                            active
                                                ? "border-[color-mix(in_srgb,var(--color-accent-primary)_35%,var(--color-border-primary))] bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)]"
                                                : "border-transparent hover:border-(--color-border-primary) hover:bg-(--color-bg-card-hover)",
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                                                    active
                                                        ? "bg-[color-mix(in_srgb,var(--color-accent-primary)_16%,transparent)] text-(--color-accent-primary)"
                                                        : "bg-[color-mix(in_srgb,var(--color-bg-primary)_70%,var(--color-accent-secondary)_10%)] text-(--color-text-secondary) group-hover:text-(--color-text-primary)",
                                                )}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-(--color-text-primary)">{item.title}</p>
                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-(--color-text-secondary)">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DocsSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const current = useMemo(
        () => docsNavigation.find((item) => item.href === pathname) ?? docsNavigation[0],
        [pathname],
    );

    return (
        <>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-(--color-border-primary) bg-(--color-bg-card) p-4 shadow-(--color-shadow) lg:hidden">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">Documentation</p>
                    <p className="mt-1 font-semibold text-(--color-text-primary)">{current.title}</p>
                </div>
                <Button variant="secondary" size="icon" onClick={() => setOpen(true)} aria-label="Open docs navigation">
                    <ListIcon size={18} />
                </Button>
            </div>

            <aside className="sticky top-6 hidden h-[calc(100dvh-3rem)] overflow-y-auto rounded-3xl border border-(--color-border-primary) bg-(--color-bg-card) p-5 shadow-(--color-shadow) lg:block">
                <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">Roundhouse Docs</p>
                    <h2 className="mt-2 text-lg font-semibold text-(--color-text-primary)">Developer Documentation</h2>
                </div>
                <SidebarLinks pathname={pathname} />
            </aside>

            {open ? (
                <div className="fixed inset-0 z-50 bg-black/45 lg:hidden">
                    <div className="absolute inset-y-0 left-0 w-[min(88vw,360px)] overflow-y-auto bg-(--color-bg-card) p-5 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">Roundhouse Docs</p>
                                <h2 className="mt-2 text-lg font-semibold text-(--color-text-primary)">Navigate</h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close docs navigation">
                                <XIcon size={18} />
                            </Button>
                        </div>
                        <SidebarLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            ) : null}
        </>
    );
}
