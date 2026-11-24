import React from "react";
import { StatusBadge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { userStatusLabels } from "@/shared/lib/enum-labels";
import { AdminUserListItem } from "@/shared/types/entities";
import { UserStatus } from "@/shared/types/enums";
import { formatDate } from "@/shared/lib/utils";

interface UserRowProps {
    user: AdminUserListItem;
    onUpdateStatus: (id: string, status: UserStatus) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    isUpdating: boolean;
    isDeleting: boolean;
}

export function UserRow({
    user,
    onUpdateStatus,
    onDelete,
    isUpdating,
    isDeleting,
}: UserRowProps) {
    return (
        <tr className="border-t border-(--color-border-subtle)">
            <td className="py-3.5 pr-4">
                <p className="font-medium text-(--color-text-primary)">{user.name}</p>
                <p className="text-xs text-(--color-text-secondary)">{user.email}</p>
            </td>
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2">
                    <StatusBadge status={user.status} />
                    <select
                        value={user.status}
                        aria-label={`Account status for ${user.name}`}
                        disabled={isUpdating}
                        className="min-h-8 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-2 text-xs text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                        onChange={(event) =>
                            onUpdateStatus(user.id, event.target.value as UserStatus)
                        }
                    >
                        {Object.values(UserStatus).map((status) => (
                            <option key={status} value={status}>
                                {userStatusLabels[status]}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="py-3.5 pr-4 font-mono text-xs">
                {user.stats.activeApiKeyCount}/{user.stats.apiKeyCount}
            </td>
            <td className="py-3.5 pr-4 font-mono text-xs">
                {user.stats.activeCustomProviderCount}/
                {user.stats.customProviderCount}
            </td>
            <td className="py-3.5 pr-4 font-mono text-xs">{user.stats.selectedModelCount}</td>
            <td className="py-3.5 pr-4 font-mono text-xs text-(--color-text-secondary)" suppressHydrationWarning>
                {formatDate(user.createdAt)}
            </td>
            <td className="py-3.5 text-right">
                <Button
                    variant="danger:outline"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => onDelete(user.id, user.name)}
                >
                    Delete
                </Button>
            </td>
        </tr>
    );
}
