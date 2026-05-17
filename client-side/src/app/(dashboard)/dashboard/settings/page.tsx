"use client";

import {
    BellIcon,
    MoonIcon,
    PasswordIcon,
    UserCircleIcon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
    useChangePasswordMutation,
    useGetMeQuery,
    useUpdateMeMutation,
} from "@/shared/store/features/auth/authApi";
import { ProfileForm } from "./components/profile-form";
import { SecurityForm } from "./components/security-form";
import { PreferenceItem } from "./components/preference-item";

export default function SettingsPage() {
    const { data: user } = useGetMeQuery();
    const [updateMe, updateMeState] = useUpdateMeMutation();
    const [changePassword, changePasswordState] = useChangePasswordMutation();

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
                        <ProfileForm
                            user={user}
                            updateMe={updateMe}
                            isLoading={updateMeState.isLoading}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <PasswordIcon size={20} /> Security
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
                        <h2 className="flex items-center gap-2 font-semibold">
                            <MoonIcon size={20} /> Preferences
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <PreferenceItem
                            icon={MoonIcon}
                            label="Default theme"
                            value="Dark / system aware"
                        />
                        <PreferenceItem
                            icon={BellIcon}
                            label="Operational alerts"
                            value="Enabled for failures"
                        />
                        <PreferenceItem
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
