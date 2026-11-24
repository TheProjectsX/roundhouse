import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface ProfileFormProps {
    user: any;
    updateMe: any;
    isLoading: boolean;
}

export function ProfileForm({ user, updateMe, isLoading }: ProfileFormProps) {
    const [name, setName] = useState("");

    useEffect(() => {
        setName(user?.name ?? "");
    }, [user?.name]);

    return (
        <form
            className="grid gap-4"
            onSubmit={async (event) => {
                event.preventDefault();
                try {
                    await updateMe({ name }).unwrap();
                    toast.success("Profile saved");
                } catch (err: any) {
                    toast.error(err?.data?.message || "Could not save profile");
                }
            }}
        >
            <label className="grid gap-1.5 text-sm font-medium">
                Full name
                <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Full name"
                    required
                />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
                Email address
                <Input
                    value={user?.email ?? ""}
                    readOnly
                    disabled
                    className="opacity-75"
                    placeholder="Email address"
                />
                <span className="text-xs font-normal text-(--color-text-muted)">
                    Managed by your account identity.
                </span>
            </label>
            <Button type="submit" disabled={isLoading}>
                Save Profile
            </Button>
        </form>
    );
}
