"use client";

import { EmptyState } from "@/shared/components/data-display/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { StatusBadge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    useDeleteAdminUserMutation,
    useGetAdminUsersQuery,
    useUpdateAdminUserStatusMutation,
} from "@/shared/store/features/admin/adminApi";
import { formatDate } from "@/shared/lib/utils";
import { UserStatus } from "@/shared/types/enums";
import { toast } from "sonner";
import { UserRow } from "./components/user-row";

export default function AdminUsersPage() {
    const { data: users = [], isLoading } = useGetAdminUsersQuery();
    const [updateStatus, updateState] = useUpdateAdminUserStatusMutation();
    const [deleteUser, deleteState] = useDeleteAdminUserMutation();

    const handleUpdateStatus = async (id: string, status: UserStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success("User status updated");
        } catch {
            toast.error("Could not update user");
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteUser(id).unwrap();
            toast.success("User deleted");
        } catch {
            toast.error("Could not delete user");
        }
    };

    return (
        <>
            <PageHeader
                title="Users"
                description="Inspect users, status, API keys, and selected models."
            />
            <Card>
                <CardContent className="overflow-x-auto pt-5">
                    <table className="w-full min-w-205 text-left text-sm">
                        <thead className="text-xs text-(--color-text-muted)">
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
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        <td colSpan={7} className="py-2">
                                            <Skeleton className="h-14 w-full rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-4">
                                        <EmptyState
                                            compact
                                            title="No users found"
                                            description="User accounts will appear here once people start signing up."
                                            className="border-none bg-transparent"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onUpdateStatus={handleUpdateStatus}
                                        onDelete={handleDeleteUser}
                                        isUpdating={updateState.isLoading}
                                        isDeleting={deleteState.isLoading}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}
