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
                } catch {
                    toast.error("Could not save profile");
                }
            }}
        >
            <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label="Name"
                placeholder="Full name"
            />
            <Input
                value={user?.email ?? ""}
                readOnly
                aria-label="Email"
                placeholder="Email address"
            />
            <Button type="submit" disabled={isLoading}>
                Save Profile
            </Button>
        </form>
    );
}
