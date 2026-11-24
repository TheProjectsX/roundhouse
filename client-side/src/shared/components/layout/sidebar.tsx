"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ArrowSquareOutIcon,
    BookOpenIcon,
    ChartLineUpIcon,
    GearSixIcon,
    GlobeIcon,
    HouseIcon,
    KeyIcon,
    PlayCircleIcon,
    ShieldCheckIcon,
    StackIcon,
    UsersIcon,
    XIcon,
} from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";
import { useAppSelector } from "@/shared/store/hooks";

const userNavGroups = [
    {
        label: "Routing",
        items: [
            { href: routes.dashboard, label: "Overview", icon: HouseIcon },
            { href: routes.apiKeys, label: "API Keys", icon: KeyIcon },
            { href: routes.playground, label: "Playground", icon: PlayCircleIcon },
        ],
    },
    {
        label: "Infrastructure",
        items: [
            { href: routes.keys, label: "Key Vault", icon: ShieldCheckIcon },
            { href: routes.providers, label: "Providers", icon: StackIcon },
            { href: routes.customProviders, label: "Custom Providers", icon: GlobeIcon },
        ],
    },
    {
        label: "System",
        items: [
            { href: routes.docs, label: "Docs", icon: BookOpenIcon },
            { href: routes.settings, label: "Settings", icon: GearSixIcon },
        ],
    },
];

const adminNavGroups = [
    {
        label: "Operations",
        items: [
            { href: routes.admin, label: "Dashboard", icon: HouseIcon },
            { href: routes.adminAnalytics, label: "Analytics", icon: ChartLineUpIcon },
            { href: routes.adminUsers, label: "Users", icon: UsersIcon },
        ],
    },
    {
        label: "Catalog",
        items: [
            { href: routes.adminProviders, label: "Providers", icon: StackIcon },
            { href: routes.adminCustomProviders, label: "Custom Providers", icon: GlobeIcon },
            { href: routes.docs, label: "Docs", icon: BookOpenIcon },
        ],
    },
];

export function SidebarNavContent({
    admin = false,
    onNavigate,
    showClose = false,
    onClose,
}: {
    admin?: boolean;
    onNavigate?: () => void;
    showClose?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const user = useAppSelector((state) => state.auth.user);
    const groups = admin ? adminNavGroups : userNavGroups;
    const crossLink = admin
        ? { href: routes.dashboard, label: "User Dashboard", icon: HouseIcon }
        : user?.role === "ADMIN"
          ? {
                href: routes.admin,
                label: "Admin Console",
                icon: ArrowSquareOutIcon,
            }
          : null;

    return (
        <div className="flex h-full flex-col justify-between">
            <div>
                <div className="flex h-12 items-center justify-between border-b border-(--color-border-subtle) px-2 pb-2">
                    <Link
                        href={admin ? routes.admin : routes.dashboard}
                        onClick={onNavigate}
                        className="flex items-center gap-2.5"
                    >
                        <Image
                            src="/logo.png"
                            alt="Roundhouse"
                            width={28}
                            height={28}
                            className="rounded-sm border border-(--color-border-primary)"
                        />
                        <span className="text-sm font-semibold tracking-tight text-(--color-text-primary)">
                            Roundhouse
                        </span>
                    </Link>
                    {showClose && onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close navigation"
                            className="grid size-8 place-items-center rounded-sm border border-(--color-border-primary) text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        >
                            <XIcon size={16} />
                        </button>
                    ) : null}
                </div>

                <nav aria-label={admin ? "Admin navigation" : "Workspace navigation"} className="mt-5 grid gap-5">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                                {group.label}
                            </p>
                            <div className="grid gap-0.5">
                                {group.items.map((item) => {
                                    const active =
                                        pathname === item.href ||
                                        (item.href !== routes.dashboard &&
                                            item.href !== routes.admin &&
                                            pathname.startsWith(`${item.href}/`));

                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                "flex min-h-9 items-center gap-2.5 rounded-sm border border-transparent px-2.5 text-sm transition-colors",
                                                active
                                                    ? "border-(--color-border-primary) bg-(--color-bg-card) font-medium text-(--color-text-primary)"
                                                    : "text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                                            )}
                                        >
                                            <Icon
                                                size={17}
                                                weight={active ? "bold" : "regular"}
                                            />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {crossLink ? (
                <div className="mt-6 border-t border-(--color-border-subtle) pt-4">
                    {(() => {
                        const CrossLinkIcon = crossLink.icon;
                        return (
                            <>
                                <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Workspace
                                </p>
                                <Link
                                    href={crossLink.href}
                                    onClick={onNavigate}
                                    className="mt-1.5 flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                                >
                                    <CrossLinkIcon size={17} />
                                    {crossLink.label}
                                </Link>
                            </>
                        );
                    })()}
                </div>
            ) : null}
        </div>
    );
}

export function Sidebar({ admin = false }: { admin?: boolean }) {
    return (
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 self-start overflow-y-auto border-r border-(--color-border-primary) bg-(--color-bg-secondary) p-3.5 lg:block">
            <SidebarNavContent admin={admin} />
        </aside>
    );
}
