"use client";

import {
    ListIcon,
    MonitorIcon,
    MoonIcon,
    SignOutIcon,
    SunIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { logout } from "@/shared/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const themes = [
    { value: "light", icon: SunIcon, label: "Light theme" },
    { value: "dark", icon: MoonIcon, label: "Dark theme" },
    { value: "system", icon: MonitorIcon, label: "System theme" },
];

export function Topbar({
    admin = false,
    onOpenMobileNav,
}: {
    admin?: boolean;
    onOpenMobileNav?: () => void;
}) {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-(--color-border-primary) bg-(--color-bg-secondary) px-4 lg:px-6">
            <div className="flex items-center gap-3">
                {onOpenMobileNav ? (
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={onOpenMobileNav}
                        aria-label="Open navigation menu"
                        className="lg:hidden"
                    >
                        <ListIcon size={18} />
                    </Button>
                ) : null}
                <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                        {admin ? "Admin Console" : "Control Panel"}
                    </p>
                    <p className="text-sm font-medium text-(--color-text-primary)">
                        {user?.name ?? "Roundhouse Operator"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div
                    role="group"
                    aria-label="Color theme"
                    className="flex rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) p-0.5"
                >
                    {themes.map((item) => {
                        const Icon = item.icon;
                        const active = mounted && theme === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setTheme(item.value)}
                                aria-pressed={active}
                                className={cn(
                                    "grid size-7 place-items-center rounded-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                                    active &&
                                        "bg-(--color-bg-card) text-(--color-text-primary)",
                                )}
                                aria-label={item.label}
                                title={item.label}
                            >
                                <Icon size={15} />
                            </button>
                        );
                    })}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sign out"
                    title="Sign out"
                    onClick={() => {
                        dispatch(logout());
                        window.location.replace(admin ? routes.adminLogin : routes.login);
                    }}
                >
                    <SignOutIcon size={18} />
                </Button>
            </div>
        </header>
    );
}
