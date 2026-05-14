import React from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface SecurityFormProps {
    changePassword: any;
    isLoading: boolean;
}

export function SecurityForm({ changePassword, isLoading }: SecurityFormProps) {
    return (
        <form
            className="grid gap-4"
            onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const oldPassword = String(form.get("oldPassword") ?? "");
                const newPassword = String(form.get("newPassword") ?? "");
                const confirmPassword = String(form.get("confirmPassword") ?? "");

                if (!oldPassword || !newPassword) {
                    toast.error("Current and new password are required");
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
            <Button type="submit" variant="secondary" disabled={isLoading}>
                Change Password
            </Button>
        </form>
    );
}
