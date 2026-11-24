import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircleIcon,
    CircleIcon,
    CloudArrowDownIcon,
    DotsThreeIcon,
    KeyIcon,
    PencilIcon,
    PlayIcon,
    PlugIcon,
    PlusIcon,
    PowerIcon,
    StackIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";
import type { ProviderListItem } from "@/shared/types/entities";

interface ProviderCardProps {
    provider: ProviderListItem;
    vaultKeysCount?: number;
    onConnect?: (provider: ProviderListItem) => void;
    onViewModels: (provider: ProviderListItem) => void;
    onTest?: (provider: ProviderListItem) => void;
    isTesting?: boolean;
    onAddModel?: (provider: ProviderListItem) => void;
    onFetchModels?: (provider: ProviderListItem) => void;
    onEdit?: (provider: ProviderListItem) => void;
    onDelete?: (id: string, name: string) => Promise<void>;
    onToggleStatus?: (id: string, currentStatus: ContentStatus) => Promise<void>;
    isDeleting?: boolean;
    isUpdatingStatus?: boolean;
}

export function ProviderCard({
    provider,
    vaultKeysCount = 0,
    onConnect,
    onViewModels,
    onTest,
    isTesting,
    onAddModel,
    onFetchModels,
    onEdit,
    onDelete,
    onToggleStatus,
    isDeleting,
    isUpdatingStatus,
}: ProviderCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };
        const onPointerDown = () => setMenuOpen(false);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [menuOpen]);

    const hasMenu = Boolean(
        onFetchModels ||
            onAddModel ||
            (provider.isCustom && (onEdit || onDelete || onToggleStatus)),
    );

    return (
        <Card className="flex flex-col justify-between transition-colors hover:border-(--color-border-focused)">
            <CardHeader className="relative">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) text-(--color-text-secondary)">
                        <StackIcon size={17} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold tracking-tight">
                            {provider.name}
                        </h2>
                        <p className="truncate font-mono text-xs text-(--color-text-muted)">
                            {provider.code}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <StatusBadge status={provider.status} />
                    {hasMenu ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`More actions for ${provider.name}`}
                            aria-expanded={menuOpen}
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuOpen((v) => !v);
                            }}
                        >
                            <DotsThreeIcon size={18} weight="bold" />
                        </Button>
                    ) : null}
                </div>

                {menuOpen ? (
                    <div
                        role="menu"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        className="absolute right-4 top-13 z-10 grid min-w-44 gap-1 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) p-1"
                    >
                        {onFetchModels ? (
                            <button
                                type="button"
                                role="menuitem"
                                className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-xs text-(--color-text-primary) hover:bg-(--color-bg-card-hover)"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onFetchModels(provider);
                                }}
                            >
                                <CloudArrowDownIcon size={14} /> Fetch upstream models
                            </button>
                        ) : null}
                        {onAddModel ? (
                            <button
                                type="button"
                                role="menuitem"
                                className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-xs text-(--color-text-primary) hover:bg-(--color-bg-card-hover)"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onAddModel(provider);
                                }}
                            >
                                <PlusIcon size={14} /> Add model manually
                            </button>
                        ) : null}
                        {provider.isCustom && onEdit ? (
                            <button
                                type="button"
                                role="menuitem"
                                className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-xs text-(--color-text-primary) hover:bg-(--color-bg-card-hover)"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit(provider);
                                }}
                            >
                                <PencilIcon size={14} /> Edit provider
                            </button>
                        ) : null}
                        {provider.isCustom && onToggleStatus ? (
                            <button
                                type="button"
                                role="menuitem"
                                disabled={isUpdatingStatus}
                                className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-xs text-(--color-text-primary) hover:bg-(--color-bg-card-hover)"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onToggleStatus(provider.id, provider.status);
                                }}
                            >
                                <PowerIcon size={14} />
                                {provider.status === ContentStatus.ACTIVE
                                    ? "Disable provider"
                                    : "Enable provider"}
                            </button>
                        ) : null}
                        {provider.isCustom && onDelete ? (
                            <>
                                <div className="my-0.5 border-t border-(--color-border-subtle)" />
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={isDeleting}
                                    className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-xs text-(--color-status-error) hover:bg-(--color-bg-card-hover)"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onDelete(provider.id, provider.name);
                                    }}
                                >
                                    <TrashIcon size={14} /> Delete provider
                                </button>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </CardHeader>
            <CardContent className="grid gap-4">
                <p className="line-clamp-2 min-h-10 text-sm text-(--color-text-secondary)">
                    {provider.description ?? `${provider.name} API Provider`}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    <Badge className="font-mono text-[11px]">{provider.type}</Badge>
                    {provider.free ? <Badge>Free Tier</Badge> : null}
                    <Badge>{provider.isCustom ? "Custom" : "Global"}</Badge>
                    {vaultKeysCount > 0 ? (
                        <Badge className="border-[color-mix(in_srgb,var(--color-status-success)_35%,transparent)] text-(--color-status-success)">
                            {vaultKeysCount} Vault{" "}
                            {vaultKeysCount === 1 ? "Key" : "Keys"}
                        </Badge>
                    ) : (
                        <Link
                            href="/dashboard/keys"
                            className="inline-flex items-center gap-1 rounded-sm border border-dashed border-(--color-border-primary) px-2 py-0.5 text-[11px] font-medium text-(--color-text-secondary) transition-colors hover:border-(--color-border-focused) hover:text-(--color-text-primary)"
                        >
                            <KeyIcon size={11} />
                            Add Vault Key
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-sm border border-(--color-border-subtle) bg-(--color-bg-input) p-3 text-xs">
                    <span className="text-(--color-text-secondary)">
                        Active Models
                    </span>
                    <span className="text-right font-mono font-medium">
                        {provider.activeModelsCount}/{provider.modelsCount}
                    </span>
                    <span className="text-(--color-text-secondary)">
                        API Key Route
                    </span>
                    <span className="flex items-center justify-end gap-1.5 font-medium">
                        {provider.connected ? (
                            <span className="inline-flex items-center gap-1 text-(--color-status-success)">
                                <CheckCircleIcon size={14} weight="fill" />
                                Connected ({provider.connectedApiCount ?? 0})
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-(--color-text-muted)">
                                <CircleIcon size={14} />
                                Not linked
                            </span>
                        )}
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--color-border-subtle) pt-3 text-xs text-(--color-text-muted)">
                    <span suppressHydrationWarning>
                        {formatDate(provider.updatedAt)}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                        {onConnect && (
                            <Button
                                variant={provider.connected ? "secondary" : "primary"}
                                size="sm"
                                onClick={() => onConnect(provider)}
                            >
                                <PlugIcon size={14} />
                                {provider.connected ? "Link Key" : "Connect"}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onViewModels(provider)}
                        >
                            Models
                        </Button>
                        {onTest && (
                            <Button
                                variant="secondary"
                                size="sm"
                                title="Test provider with a random active model"
                                disabled={isTesting}
                                onClick={() => onTest(provider)}
                            >
                                <PlayIcon size={13} weight="fill" />
                                {isTesting ? "..." : "Test"}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
