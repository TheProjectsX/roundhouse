"use client";

import {
    MonitorIcon,
    MoonIcon,
    PasswordIcon,
    SunIcon,
    UserCircleIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import {
    useChangePasswordMutation,
    useGetMeQuery,
    useUpdateMeMutation,
} from "@/shared/store/features/auth/authApi";
import { ProfileForm } from "./components/profile-form";
import { SecurityForm } from "./components/security-form";

export default function SettingsPage() {
    const { data: user, isLoading, isError, refetch } = useGetMeQuery();
    const [updateMe, updateMeState] = useUpdateMeMutation();
    const [changePassword, changePasswordState] = useChangePasswordMutation();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <PageHeader
                title="Settings"
                description="Profile, password security, and console appearance."
            />
            {isError ? (
                <EmptyState
                    title="Could not load account settings"
                    description="Check your connection or session and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <section className="grid gap-5 xl:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <UserCircleIcon size={18} /> Profile
                            </h2>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="grid gap-3">
                                    <Skeleton className="h-9 rounded-sm" />
                                    <Skeleton className="h-9 rounded-sm" />
                                    <Skeleton className="h-9 w-32 rounded-sm" />
                                </div>
                            ) : (
                                <ProfileForm
                                    user={user}
                                    updateMe={updateMe}
                                    isLoading={updateMeState.isLoading}
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <PasswordIcon size={18} /> Security
                            </h2>
                        </CardHeader>
                        <CardContent>
                            <SecurityForm
                                changePassword={changePassword}
                                isLoading={changePasswordState.isLoading}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <MoonIcon size={18} /> Appearance
                            </h2>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div>
                                <p className="text-xs font-medium text-(--color-text-secondary)">
                                    Console theme
                                </p>
                                <div
                                    role="group"
                                    aria-label="Console theme"
                                    className="mt-2 grid grid-cols-3 gap-1.5"
                                >
                                    {[
                                        { value: "light", label: "Light", icon: SunIcon },
                                        { value: "dark", label: "Dark", icon: MoonIcon },
                                        { value: "system", label: "System", icon: MonitorIcon },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const active = mounted && theme === item.value;
                                        return (
                                            <Button
                                                key={item.value}
                                                type="button"
                                                size="sm"
                                                aria-pressed={active}
                                                variant={active ? "primary" : "secondary"}
                                                onClick={() => setTheme(item.value)}
                                            >
                                                <Icon size={14} />
                                                {item.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg-secondary) p-3 text-xs">
                                <p className="text-(--color-text-muted)">Account role</p>
                                <p className="mt-1 font-mono font-medium text-(--color-text-primary)">
                                    {user?.role ?? "USER"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </>
    );
}
