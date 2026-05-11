"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartLineUp, GearSix, House, Key, ShieldCheck, Stack, Users } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";

const userNav = [
    { href: routes.dashboard, label: "Overview", icon: House },
    { href: routes.apiKeys, label: "API Keys", icon: Key },
    { href: routes.providers, label: "Providers", icon: Stack },
    { href: routes.keys, label: "Key Vault", icon: ShieldCheck },
    { href: routes.docs, label: "Docs", icon: BookOpen },
    { href: routes.settings, label: "Settings", icon: GearSix },
];

const adminNav = [
    { href: routes.admin, label: "Dashboard", icon: ChartLineUp },
    { href: routes.adminProviders, label: "Providers", icon: Stack },
    { href: routes.adminUsers, label: "Users", icon: Users },
    { href: routes.adminAnalytics, label: "Analytics", icon: ChartLineUp },
];

export function Sidebar({ admin = false }: { admin?: boolean }) {
    const pathname = usePathname();
    const nav = admin ? adminNav : userNav;

    return (
        <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 self-start overflow-y-auto border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4 lg:block">
            <Link href={admin ? routes.admin : routes.dashboard} className="flex h-12 items-center gap-3 rounded-[var(--radius-md)] px-3">
                <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-primary)] font-mono font-bold text-[var(--color-text-inverse)]">
                    R
                </span>
                <span className="font-semibold tracking-tight">Roundhouse</span>
            </Link>
            <nav className="mt-8 grid gap-1">
                {nav.map((item) => {
                    const active = item.href === routes.dashboard ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]",
                                active && "bg-[var(--color-bg-card)] text-[var(--color-text-primary)]",
                            )}
                        >
                            <Icon size={20} weight={active ? "duotone" : "regular"} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
