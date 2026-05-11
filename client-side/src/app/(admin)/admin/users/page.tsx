"use client";

import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { StatusBadge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useDeleteAdminUserMutation, useGetAdminUsersQuery, useUpdateAdminUserStatusMutation } from "@/shared/store/api";
import { formatDate } from "@/shared/lib/utils";
import { UserStatus } from "@/shared/types/enums";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const { data: users = [] } = useGetAdminUsersQuery();
    const [updateStatus, updateState] = useUpdateAdminUserStatusMutation();
    const [deleteUser, deleteState] = useDeleteAdminUserMutation();

    return (
        <>
            <PageHeader title="Users" description="Inspect users, status, API keys, and selected models." />
            <Card>
                <CardContent className="overflow-x-auto pt-5">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="text-xs text-[var(--color-text-muted)]">
                            <tr>
                                <th className="pb-3 font-medium">User</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">API Keys</th>
                                <th className="pb-3 font-medium">Providers</th>
                                <th className="pb-3 font-medium">Models</th>
                                <th className="pb-3 font-medium">Created</th>
                                <th className="pb-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t border-[var(--color-border-subtle)]">
                                    <td className="py-4">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-[var(--color-text-secondary)]">{user.email}</p>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={user.status} />
                                            <select
                                                value={user.status}
                                                disabled={updateState.isLoading}
                                                className="min-h-9 rounded-[var(--radius-sm)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                                onChange={async (event) => {
                                                    try {
                                                        await updateStatus({ id: user.id, status: event.target.value as UserStatus }).unwrap();
                                                        toast.success("User status updated");
                                                    } catch {
                                                        toast.error("Could not update user");
                                                    }
                                                }}
                                            >
                                                {Object.values(UserStatus).map((status) => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="py-4 font-mono">{user.stats.activeApiKeyCount}/{user.stats.apiKeyCount}</td>
                                    <td className="py-4 font-mono">{user.stats.activeCustomProviderCount}/{user.stats.customProviderCount}</td>
                                    <td className="py-4 font-mono">{user.stats.selectedModelCount}</td>
                                    <td className="py-4 text-[var(--color-text-secondary)]">{formatDate(user.createdAt)}</td>
                                    <td className="py-4 text-right">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={deleteState.isLoading}
                                            onClick={async () => {
                                                if (!window.confirm(`Delete ${user.name}?`)) return;
                                                try {
                                                    await deleteUser(user.id).unwrap();
                                                    toast.success("User deleted");
                                                } catch {
                                                    toast.error("Could not delete user");
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}
