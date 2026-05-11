"use client";

import {
    BellIcon,
    MoonIcon,
    PasswordIcon,
    UserCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    useChangePasswordMutation,
    useGetMeQuery,
    useUpdateMeMutation,
} from "@/shared/store/api";

export default function SettingsPage() {
    const { data: user } = useGetMeQuery();
    const [name, setName] = useState("");
    const [updateMe, updateMeState] = useUpdateMeMutation();
    const [changePassword, changePasswordState] = useChangePasswordMutation();

    useEffect(() => {
        setName(user?.name ?? "");
    }, [user?.name]);

    return (
        <>
            <PageHeader
                title="Settings"
                description="Profile, password, and workspace preferences."
            />
            <section className="grid gap-5 xl:grid-cols-3">
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <UserCircleIcon size={20} /> Profile
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                try {
                                    await updateMe({ name }).unwrap();
                                    toast.success("Profile saved");
                                } catch {
                                    toast.error("Could not save profile");
                                }
                            }}
                        >
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                aria-label="Name"
                            />
                            <Input
                                value={user?.email ?? ""}
                                readOnly
                                aria-label="Email"
                            />
                            <Button
                                type="submit"
                                disabled={updateMeState.isLoading}
                            >
                                Save Profile
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <PasswordIcon size={20} /> Security
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                const form = new FormData(event.currentTarget);
                                const oldPassword = String(
                                    form.get("oldPassword") ?? "",
                                );
                                const newPassword = String(
                                    form.get("newPassword") ?? "",
                                );
                                const confirmPassword = String(
                                    form.get("confirmPassword") ?? "",
                                );

                                if (!oldPassword || !newPassword) {
                                    toast.error(
                                        "Current and new password are required",
                                    );
                                    return;
                                }

                                if (newPassword !== confirmPassword) {
                                    toast.error("New passwords do not match");
                                    return;
                                }

                                try {
                                    await changePassword({
                                        oldPassword,
                                        newPassword,
                                    }).unwrap();
                                    toast.success("Password changed");
                                    event.currentTarget.reset();
                                } catch {
                                    toast.error("Could not change password");
                                }
                            }}
                        >
                            <Input
                                name="oldPassword"
                                type="password"
                                placeholder="Current password"
                                autoComplete="current-password"
                            />
                            <Input
                                name="newPassword"
                                type="password"
                                placeholder="New password"
                                autoComplete="new-password"
                            />
                            <Input
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={changePasswordState.isLoading}
                            >
                                Change Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <MoonIcon size={20} /> Preferences
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <Preference
                            icon={MoonIcon}
                            label="Default theme"
                            value="Dark / system aware"
                        />
                        <Preference
                            icon={BellIcon}
                            label="Operational alerts"
                            value="Enabled for failures"
                        />
                        <Preference
                            icon={UserCircleIcon}
                            label="Items per page"
                            value="25 rows"
                        />
                    </CardContent>
                </Card>
            </section>
        </>
    );
}

function Preference({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MoonIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between rounded-md bg-(--color-bg-input) p-3">
            <span className="flex items-center gap-2">
                <Icon size={17} /> {label}
            </span>
            <span className="text-(--color-text-secondary)">{value}</span>
        </div>
    );
}
