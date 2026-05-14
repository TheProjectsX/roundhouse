import React from "react";
import { StatusBadge } from "@/shared/components/ui/badge";
import { AdminUserListItem } from "@/shared/types/entities";

interface RecentUserItemProps {
    user: AdminUserListItem;
}

export function RecentUserItem({ user }: RecentUserItemProps) {
    return (
        <div className="grid gap-3 rounded-md bg-(--color-bg-input) p-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.name}</h3>
                    <StatusBadge status={user.status} />
                </div>
                <p className="text-sm text-(--color-text-secondary)">
                    {user.email}
                </p>
            </div>
            <p className="font-mono text-sm">
                {user.stats.activeApiKeyCount}/{user.stats.apiKeyCount} active keys
            </p>
        </div>
    );
}
