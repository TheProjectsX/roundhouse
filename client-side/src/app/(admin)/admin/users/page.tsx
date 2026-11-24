"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useDeleteAdminUserMutation,
    useGetAdminUserBinQuery,
    useGetAdminUsersQuery,
    usePermanentDeleteAdminUserMutation,
    useRestoreAdminUserMutation,
    useUpdateAdminUserStatusMutation,
} from "@/shared/store/features/admin/adminApi";
import { userStatusLabels } from "@/shared/lib/enum-labels";
import { UserStatus } from "@/shared/types/enums";
import { UserRow } from "./components/user-row";

export default function AdminUsersPage() {
    const {
        data: users = [],
        isLoading,
        isError,
        refetch,
    } = useGetAdminUsersQuery();
    const {
        data: binnedUsers = [],
        isLoading: isBinLoading,
        isError: isBinError,
        refetch: refetchBin,
    } = useGetAdminUserBinQuery();
    const [viewMode, setViewMode] = useState<"active" | "bin">("active");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [confirmDelete, setConfirmDelete] = useState<{
        mode: "soft" | "permanent";
        id: string;
        name: string;
    } | null>(null);
    const [confirmStatus, setConfirmStatus] = useState<{
        id: string;
        name: string;
        status: UserStatus;
    } | null>(null);
    const [updateStatus, updateState] = useUpdateAdminUserStatusMutation();
    const [deleteUser, deleteState] = useDeleteAdminUserMutation();
    const [restoreUser, restoreState] = useRestoreAdminUserMutation();
    const [permanentDeleteUser, permanentDeleteState] =
        usePermanentDeleteAdminUserMutation();

    const activeSource = viewMode === "bin" ? binnedUsers : users;

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        return activeSource.filter((u) => {
            if (statusFilter !== "ALL" && u.status !== statusFilter)
                return false;
            if (!term) return true;
            return (
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
        });
    }, [activeSource, search, statusFilter]);

    const applyStatusUpdate = async (id: string, status: UserStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success("User status updated");
            setConfirmStatus(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update user");
        }
    };

    const handleUpdateStatus = async (
        id: string,
        name: string,
        status: UserStatus,
    ) => {
        if (status === UserStatus.BANNED || status === UserStatus.INACTIVE) {
            setConfirmStatus({ id, name, status });
            return;
        }
        await applyStatusUpdate(id, status);
    };

    const handleRestoreUser = async (id: string, name: string) => {
        try {
            await restoreUser(id).unwrap();
            toast.success(`"${name}" restored`);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not restore user");
        }
    };

    const confirmDeleteUser = async () => {
        if (!confirmDelete) return;
        try {
            if (confirmDelete.mode === "permanent") {
                await permanentDeleteUser(confirmDelete.id).unwrap();
                toast.success("User permanently deleted");
            } else {
                await deleteUser(confirmDelete.id).unwrap();
                toast.success("User moved to bin");
            }
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not delete user");
        }
    };

    return (
        <>
            <PageHeader
                title="Users"
                description="Inspect accounts, manage status, and audit API key and model usage."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={
                                viewMode === "active" ? "primary" : "secondary"
                            }
                            onClick={() => setViewMode("active")}
                        >
                            Users ({users.length})
                        </Button>
                        <Button
                            variant={
                                viewMode === "bin" ? "primary" : "secondary"
                            }
                            onClick={() => setViewMode("bin")}
                        >
                            <TrashIcon size={15} />
                            Bin ({binnedUsers.length})
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-col gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <MagnifyingGlassIcon
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user name or email..."
                        aria-label="Search users"
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by user status"
                        className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-xs text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                    >
                        <option value="ALL">All statuses</option>
                        {Object.values(UserStatus).map((s) => (
                            <option key={s} value={s}>
                                {userStatusLabels[s]}
                            </option>
                        ))}
                    </select>
                    <span className="font-mono text-xs text-(--color-text-muted)">
                        {filteredUsers.length}/{activeSource.length}
                    </span>
                </div>
            </div>

            {(viewMode === "bin" ? isBinError : isError) ? (
                <EmptyState
                    title="Could not load users"
                    description="Check your admin session and retry."
                    action={
                        <Button
                            variant="secondary"
                            onClick={() =>
                                viewMode === "bin" ? refetchBin() : refetch()
                            }
                        >
                            Retry
                        </Button>
                    }
                />
            ) : (
                <Card>
                    <CardContent className="overflow-x-auto p-5">
                        <table className="w-full min-w-205 text-left text-sm">
                            <thead className="font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
                                <tr>
                                    <th className="pb-3 font-medium">User</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">
                                        API Keys
                                    </th>
                                    <th className="pb-3 font-medium">
                                        Providers
                                    </th>
                                    <th className="pb-3 font-medium">Models</th>
                                    <th className="pb-3 font-medium">
                                        {viewMode === "bin" ? "Deleted" : "Created"}
                                    </th>
                                    <th className="pb-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(viewMode === "bin" ? isBinLoading : isLoading) ? (
                                    Array.from({ length: 5 }).map(
                                        (_, index) => (
                                            <tr key={index}>
                                                <td
                                                    colSpan={7}
                                                    className="py-2"
                                                >
                                                    <Skeleton className="h-12 w-full rounded-sm" />
                                                </td>
                                            </tr>
                                        ),
                                    )
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-4">
                                            <EmptyState
                                                compact
                                                title={
                                                    search ||
                                                    statusFilter !== "ALL"
                                                        ? "No matching users"
                                                        : viewMode === "bin"
                                                          ? "Bin is empty"
                                                          : "No users found"
                                                }
                                                description={
                                                    search ||
                                                    statusFilter !== "ALL"
                                                        ? "Try clearing your search or status filter."
                                                        : viewMode === "bin"
                                                          ? "Soft-deleted user accounts will appear here."
                                                          : "User accounts will appear here once people start signing up."
                                                }
                                                className="border-none bg-transparent"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            isBin={viewMode === "bin"}
                                            onUpdateStatus={(id, status) =>
                                                handleUpdateStatus(
                                                    id,
                                                    user.name,
                                                    status,
                                                )
                                            }
                                            onSoftDelete={async (id, name) =>
                                                setConfirmDelete({
                                                    mode: "soft",
                                                    id,
                                                    name,
                                                })
                                            }
                                            onRestore={handleRestoreUser}
                                            onPermanentDelete={async (id, name) =>
                                                setConfirmDelete({
                                                    mode: "permanent",
                                                    id,
                                                    name,
                                                })
                                            }
                                            isUpdating={updateState.isLoading}
                                            isDeleting={
                                                deleteState.isLoading ||
                                                restoreState.isLoading ||
                                                permanentDeleteState.isLoading
                                            }
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {confirmStatus && (
                <ConfirmModal
                    title={`Set User ${userStatusLabels[confirmStatus.status]}`}
                    description={`Change "${confirmStatus.name}" to ${userStatusLabels[confirmStatus.status]}? This will immediately affect their API and dashboard access.`}
                    confirmLabel={`Set ${userStatusLabels[confirmStatus.status]}`}
                    isLoading={updateState.isLoading}
                    onConfirm={() =>
                        applyStatusUpdate(
                            confirmStatus.id,
                            confirmStatus.status,
                        )
                    }
                    onCancel={() => setConfirmStatus(null)}
                />
            )}

            {confirmDelete && (
                <ConfirmModal
                    title={
                        confirmDelete.mode === "permanent"
                            ? "Permanently Delete User Account"
                            : "Move User to Bin"
                    }
                    description={
                        confirmDelete.mode === "permanent"
                            ? `This action cannot be undone. Permanently delete "${confirmDelete.name}" along with all of their API keys, vault secrets, custom providers, models, selections, and usage analytics?`
                            : `Move "${confirmDelete.name}" to the bin? Their dashboard and API access will be disabled while preserving usage analytics, and you can restore them anytime.`
                    }
                    confirmLabel={
                        confirmDelete.mode === "permanent"
                            ? "Permanently Delete"
                            : "Move to Bin"
                    }
                    isLoading={
                        deleteState.isLoading || permanentDeleteState.isLoading
                    }
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </>
    );
}
