import React from "react";
import {
    CheckCircleIcon,
    CircleIcon,
    PencilIcon,
    PlugIcon,
    PlusIcon,
    StackIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";
import type { ProviderListItem } from "@/shared/types/entities";

interface ProviderCardProps {
    provider: ProviderListItem;
    onViewModels: (provider: ProviderListItem) => void;
    onAddModel?: (provider: ProviderListItem) => void;
    onEdit?: (provider: ProviderListItem) => void;
    onDelete?: (id: string, name: string) => Promise<void>;
    onToggleStatus?: (id: string, currentStatus: ContentStatus) => Promise<void>;
    isDeleting?: boolean;
    isUpdatingStatus?: boolean;
}

export function ProviderCard({
    provider,
    onViewModels,
    onAddModel,
    onEdit,
    onDelete,
    onToggleStatus,
    isDeleting,
    isUpdatingStatus,
}: ProviderCardProps) {
    return (
        <Card className="transition-colors hover:bg-(--color-bg-card-hover)">
            <CardHeader>
                <div className="grid size-11 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-(--color-accent-primary)">
                    <StackIcon size={22} weight="duotone" />
                </div>
                <StatusBadge status={provider.status} />
            </CardHeader>
            <CardContent className="grid gap-4">
                <div>
                    <h2 className="font-semibold tracking-tight">
                        {provider.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-(--color-text-secondary)">
                        {provider.description ?? `${provider.name} API Provider`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge>{provider.type}</Badge>
                    {provider.free ? <Badge>Free</Badge> : null}
                    <Badge>{provider.isCustom ? "Custom" : "Global"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-(--color-bg-input) p-3 text-sm">
                    <span className="text-(--color-text-secondary)">Models</span>
                    <span className="text-right font-mono">
                        {provider.activeModelsCount}/{provider.modelsCount}
                    </span>
                    <span className="text-(--color-text-secondary)">
                        Connected
                    </span>
                    <span className="flex justify-end text-(--color-status-success)">
                        {provider.connected ? (
                            <CheckCircleIcon size={18} weight="fill" />
                        ) : (
                            <CircleIcon size={18} />
                        )}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-(--color-text-muted)">
                    <span suppressHydrationWarning>{formatDate(provider.updatedAt)}</span>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onViewModels(provider)}
                        >
                            Models
                        </Button>
                        {onAddModel && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onAddModel(provider)}
                            >
                                <PlusIcon size={14} /> Add
                            </Button>
                        )}
                    </div>
                </div>
                {provider.isCustom && (onEdit || onDelete || onToggleStatus) && (
                    <div className="flex justify-between gap-1 border-t border-(--color-border-subtle) pt-3">
                        <div className="flex gap-1">
                            {onEdit && (
                                <Button
                                    variant="primary:outline"
                                    size="icon"
                                    aria-label="Edit provider"
                                    onClick={() => onEdit(provider)}
                                >
                                    <PencilIcon size={16} />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="danger:outline"
                                    size="icon"
                                    aria-label="Delete provider"
                                    disabled={isDeleting}
                                    onClick={() =>
                                        onDelete(provider.id, provider.name)
                                    }
                                >
                                    <TrashIcon size={16} />
                                </Button>
                            )}
                        </div>
                        {onToggleStatus && (
                            <Button
                                variant={
                                    provider.status === ContentStatus.ACTIVE
                                        ? "danger:outline"
                                        : "success:outline"
                                }
                                size="sm"
                                disabled={isUpdatingStatus}
                                onClick={() =>
                                    onToggleStatus(provider.id, provider.status)
                                }
                            >
                                <PlugIcon size={16} />{" "}
                                {provider.status === ContentStatus.ACTIVE
                                    ? "Disable"
                                    : "Enable"}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
