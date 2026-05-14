"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpenIcon,
    ChartLineUpIcon,
    GearSixIcon,
    GlobeIcon,
    HouseIcon,
    KeyIcon,
    ShieldCheckIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";

const userNav = [
    { href: routes.dashboard, label: "Overview", icon: HouseIcon },
    { href: routes.apiKeys, label: "API Keys", icon: KeyIcon },
    { href: routes.providers, label: "Providers", icon: StackIcon },
    { href: routes.keys, label: "Key Vault", icon: ShieldCheckIcon },
    { href: routes.docs, label: "Docs", icon: BookOpenIcon },
    { href: routes.settings, label: "Settings", icon: GearSixIcon },
];

const adminNav = [
    { href: routes.admin, label: "Dashboard", icon: ChartLineUpIcon },
    { href: routes.adminProviders, label: "Providers", icon: StackIcon },
    {
        href: routes.adminCustomProviders,
        label: "Custom Providers",
        icon: GlobeIcon,
    },
    { href: routes.adminUsers, label: "Users", icon: UsersIcon },
    { href: routes.adminAnalytics, label: "Analytics", icon: ChartLineUpIcon },
];

export function Sidebar({ admin = false }: { admin?: boolean }) {
    const pathname = usePathname();
    const nav = admin ? adminNav : userNav;

    return (
        <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 self-start overflow-y-auto border-r border-(--color-border-primary) bg-(--color-bg-secondary) p-4 lg:block">
            <Link
                href={admin ? routes.admin : routes.dashboard}
                className="flex h-12 items-center gap-3 rounded-md px-3"
            >
                <span className="grid size-9 place-items-center rounded-md bg-(--color-accent-primary) font-mono font-bold text-(--color-text-inverse)">
                    R
                </span>
                <span className="font-semibold tracking-tight">Roundhouse</span>
            </Link>
            <nav className="mt-8 grid gap-1">
                {nav.map((item) => {
                    const active = pathname === item.href;

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                                active &&
                                    "bg-(--color-bg-card) text-(--color-text-primary)",
                            )}
                        >
                            <Icon
                                size={20}
                                weight={active ? "duotone" : "regular"}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
