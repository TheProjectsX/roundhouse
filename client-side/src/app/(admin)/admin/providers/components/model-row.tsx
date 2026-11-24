import React from "react";
import { PenIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { contentStatusLabels } from "@/shared/lib/enum-labels";
import { cn, formatNumber } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

interface ModelRowProps {
    model: any;
    onUpdateStatus: (id: string, status: ContentStatus) => Promise<void>;
    onEdit: () => void;
    onDelete: (id: string, name: string) => Promise<void>;
    isDeleting: boolean;
    isUpdatingStatus: boolean;
}

export function ModelRow({
    model,
    onUpdateStatus,
    onEdit,
    onDelete,
    isDeleting,
    isUpdatingStatus,
}: ModelRowProps) {
    return (
        <tr className="transition-colors hover:bg-(--color-bg-card)">
            <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className={cn(
                            "size-1.5 rounded-xs",
                            model.status === ContentStatus.ACTIVE
                                ? "bg-(--color-status-success)"
                                : "bg-(--color-text-muted)",
                        )}
                    />
                    <span>{model.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 font-mono text-xs text-(--color-text-secondary)">
                {model.code}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-(--color-text-secondary)">
                {model.maxTokens
                    ? formatCompactNumber(model.maxTokens)
                    : "Unlimited"}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-(--color-bg-card)">
                        <div
                            className="h-full bg-(--color-accent-primary)"
                            style={{
                                width: `${(model.efficiencyScore ?? 0) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="font-mono text-xs font-semibold">
                        {((model.efficiencyScore ?? 0) * 100).toFixed(0)}%
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                    <span className="text-(--color-status-success)">
                        {formatNumber(model.totalSuccessCount)}
                    </span>
                    <span className="text-(--color-text-muted)">/</span>
                    <span className="text-(--color-status-error)">
                        {formatNumber(model.totalFailureCount)}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <select
                    value={model.status}
                    aria-label={`Status for ${model.name}`}
                    disabled={isUpdatingStatus}
                    className="h-8 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-2 text-xs font-medium text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                    onChange={(event) =>
                        onUpdateStatus(model.id, event.target.value as ContentStatus)
                    }
                >
                    {Object.values(ContentStatus).map((status) => (
                        <option key={status} value={status}>
                            {contentStatusLabels[status]}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1.5">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${model.name}`}
                        onClick={onEdit}
                    >
                        <PenIcon size={14} />
                    </Button>
                    <Button
                        variant="danger:outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Delete ${model.name}`}
                        disabled={isDeleting}
                        onClick={() => onDelete(model.id, model.name)}
                    >
                        <TrashIcon size={14} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
