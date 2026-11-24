import React, { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatNumber } from "@/shared/lib/utils";
import type { ApiKeyModelSelectionListItem } from "@/shared/types/entities";

interface ModelPriorityListProps {
    models: ApiKeyModelSelectionListItem[];
    onReorder: (models: ApiKeyModelSelectionListItem[]) => void;
}

export function ModelPriorityList({ models, onReorder }: ModelPriorityListProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const moveItem = (fromIndex: number, toIndex: number) => {
        if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= models.length ||
            toIndex >= models.length ||
            fromIndex === toIndex
        ) {
            return;
        }
        const newModels = [...models];
        const [movedItem] = newModels.splice(fromIndex, 1);
        newModels.splice(toIndex, 0, movedItem);
        onReorder(
            newModels.map((model, index) => ({
                ...model,
                priority: index + 1,
            })),
        );
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e: React.DragEvent, targetId: string) => {
        if (draggedId && draggedId !== targetId) {
            setDragOverId(targetId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget === e.target) {
            setDragOverId(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const draggedIndex = models.findIndex(
            (m) => m.modelSelectionId === draggedId,
        );
        const targetIndex = models.findIndex(
            (m) => m.modelSelectionId === targetId,
        );

        moveItem(draggedIndex, targetIndex);
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    return (
        <div className="grid gap-2">
            {models.map((item, index) => (
                <div
                    key={item.modelSelectionId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.modelSelectionId)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, item.modelSelectionId)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.modelSelectionId)}
                    onDragEnd={handleDragEnd}
                    className={`grid cursor-move gap-3 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) p-3 transition-colors md:grid-cols-[auto_1fr_auto] md:items-center ${
                        draggedId === item.modelSelectionId
                            ? "opacity-50"
                            : ""
                    } ${
                        dragOverId === item.modelSelectionId
                            ? "border-(--color-border-focused) bg-(--color-bg-card-hover)"
                            : ""
                    } ${!item.active ? "opacity-65" : ""}`}
                >
                    <div className="flex items-center gap-1 text-(--color-text-muted)">
                        <span className="w-6 text-center font-mono text-xs font-semibold">
                            {index + 1}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => moveItem(index, index - 1)}
                        >
                            <ArrowUpIcon size={14} />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Move down"
                            disabled={index === models.length - 1}
                            onClick={() => moveItem(index, index + 1)}
                        >
                            <ArrowDownIcon size={14} />
                        </Button>
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-medium">
                                {item.model.name}
                            </h3>
                            <StatusBadge status={item.active} />
                        </div>
                        <p className="truncate font-mono text-xs text-(--color-text-muted)">
                            {item.provider.name} / {item.model.code}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Badge>
                            {formatNumber(item.stats.tokenUsage)}{" "}
                            <span className="text-(--color-status-info)">
                                tokens
                            </span>
                        </Badge>
                        <Badge>
                            {formatNumber(item.stats.successCount)}{" "}
                            <span className="text-(--color-status-success)">
                                ok
                            </span>
                        </Badge>
                        <Badge>
                            {formatNumber(item.stats.failureCount)}{" "}
                            <span className="text-(--color-status-error)">
                                fail
                            </span>
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}
