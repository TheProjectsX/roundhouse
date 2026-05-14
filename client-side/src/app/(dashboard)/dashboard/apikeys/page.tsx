"use client";

import { GitBranchIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
    useCreateApiKeyMutation,
    useDeleteApiKeyMutation,
    useGetApiKeysQuery,
    useUpdateApiKeyStatusMutation,
} from "@/shared/store/features/api/roundhouseApi";
import { CreateApiKeyModal } from "./components/create-api-key-modal";
import { ApiKeySkeletons } from "./components/api-key-skeletons";
import { ApiKeyCard } from "./components/api-key-card";

export default function ApiKeysPage() {
    const { data: apiKeys = [], isLoading } = useGetApiKeysQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [createApiKey, createState] = useCreateApiKeyMutation();
    const [updateStatus, updateStatusState] = useUpdateApiKeyStatusMutation();
    const [deleteApiKey, deleteState] = useDeleteApiKeyMutation();

    const handleUpdateStatus = async (id: string, active: boolean) => {
        try {
            await updateStatus({
                id,
                active,
            }).unwrap();
            setOpenMenuId(null);
            toast.success(active ? "API key enabled" : "API key disabled");
        } catch {
            toast.error("Could not update API key");
        }
    };

    const handleDeleteApiKey = async (id: string, name: string) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteApiKey(id).unwrap();
            setOpenMenuId(null);
            toast.success("API key deleted");
        } catch {
            toast.error("Could not delete API key");
        }
    };

    return (
        <>
            <PageHeader
                title="API Keys"
                description="Manage Roundhouse API keys and their provider configurations."
                actions={
                    <Button onClick={() => setShowCreate((value) => !value)}>
                        Create API Key
                    </Button>
                }
            />
            {showCreate && (
                <CreateApiKeyModal
                    onClose={() => setShowCreate(false)}
                    createApiKey={createApiKey}
                    isLoading={createState.isLoading}
                />
            )}
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? <ApiKeySkeletons /> : null}
                {apiKeys.map((item) => (
                    <ApiKeyCard
                        key={item.id}
                        item={item}
                        isMenuOpen={openMenuId === item.id}
                        onToggleMenu={() =>
                            setOpenMenuId((value) =>
                                value === item.id ? null : item.id,
                            )
                        }
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteApiKey}
                        isUpdating={updateStatusState.isLoading}
                        isDeleting={deleteState.isLoading}
                    />
                ))}
            </section>
            <Card>
                <CardContent className="flex items-start gap-4 pt-5">
                    <GitBranchIcon
                        className="text-(--color-accent-primary)"
                        size={24}
                        weight="duotone"
                    />
                    <div>
                        <h2 className="font-semibold tracking-tight">
                            Roundhouse routing summary
                        </h2>
                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                            Production keys use efficiency scoring first, then
                            fail over through active providers while excluding
                            failed model attempts from the current request
                            cycle.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
