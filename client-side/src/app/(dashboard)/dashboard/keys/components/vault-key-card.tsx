import React from "react";
import {
    CopyIcon,
    TimerIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/utils";

interface VaultKeyCardProps {
    item: any;
    revealed: string | undefined;
    onUpdateStatus: (id: string, active: boolean) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    isUpdating: boolean;
    isDeleting: boolean;
}

export function VaultKeyCard({
    item,
    revealed,
    onUpdateStatus,
    onDelete,
    isUpdating,
    isDeleting,
}: VaultKeyCardProps) {
    return (
        <Card>
            <CardContent className="grid gap-4 pt-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold tracking-tight">
                            {item.name}
                        </h2>
                        <StatusBadge status={item.active} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className="bg-[color-mix(in_srgb,var(--color-accent-secondary)_12%,transparent)] text-(--color-accent-secondary)">
                            {item.provider ?? "Unassigned provider"}
                        </Badge>
                    </div>
                </div>
                <div className="rounded-md bg-(--color-bg-input) px-3 py-2 font-mono text-sm">
                    {revealed ?? item.key}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-(--color-text-muted)" suppressHydrationWarning>
                        Updated {formatDate(item.updatedAt)}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {revealed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-(--color-status-warning)">
                                <TimerIcon size={14} /> visible
                            </span>
                        ) : null}
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.id, !item.active)}
                        >
                            {item.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy key"
                            onClick={async () => {
                                await navigator.clipboard.writeText(
                                    revealed ?? item.key,
                                );
                                toast.success("Vault key copied");
                            }}
                        >
                            <CopyIcon size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete key"
                            disabled={isDeleting}
                            onClick={() => onDelete(item.id, item.name)}
                        >
                            <TrashIcon size={18} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
