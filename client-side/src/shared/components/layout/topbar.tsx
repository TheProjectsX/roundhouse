"use client";

import { Monitor, Moon, SignOut, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { logout } from "@/shared/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
];

export function Topbar({ admin = false }: { admin?: boolean }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { theme, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--color-border-primary)] bg-[color-mix(in_srgb,var(--color-bg-secondary)_92%,transparent)] px-4 backdrop-blur-xl lg:px-6">
            <div>
                <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{admin ? "Admin Console" : "Control Plane"}</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{user?.name ?? "Roundhouse Operator"}</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden rounded-[var(--radius-md)] border border-[var(--color-border-primary)] p-1 sm:flex">
                    {themes.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setTheme(item.value)}
                                className={cn(
                                    "grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]",
                                    theme === item.value && "bg-[var(--color-bg-card)] text-[var(--color-text-primary)]",
                                )}
                                aria-label={item.label}
                            >
                                <Icon size={17} />
                            </button>
                        );
                    })}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Sign out"
                    onClick={() => {
                        dispatch(logout());
                        router.push(admin ? routes.adminLogin : routes.login);
                    }}
                >
                    <SignOut size={20} />
                </Button>
            </div>
        </header>
    );
}
