import React, { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { formatNumber } from "@/shared/lib/utils";
import type { ApiKeyModelSelectionListItem } from "@/shared/types/entities";

interface ModelPriorityListProps {
    models: ApiKeyModelSelectionListItem[];
    onReorder: (models: ApiKeyModelSelectionListItem[]) => void;
}

export function ModelPriorityList({ models, onReorder }: ModelPriorityListProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

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

        const draggedIndex = models.findIndex((m) => m.modelSelectionId === draggedId);
        const targetIndex = models.findIndex((m) => m.modelSelectionId === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const newModels = [...models];
        const [movedItem] = newModels.splice(draggedIndex, 1);
        newModels.splice(targetIndex, 0, movedItem);

        const reorderedModels = newModels.map((model, index) => ({
            ...model,
            priority: index + 1,
        }));

        onReorder(reorderedModels);
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
                    className={`grid gap-3 rounded-md bg-(--color-bg-input) p-3 md:grid-cols-[40px_1fr_auto] md:items-center cursor-move transition-all ${
                        draggedId === item.modelSelectionId ? "opacity-50 scale-95" : ""
                    } ${
                        dragOverId === item.modelSelectionId
                            ? "ring-2 ring-(--color-accent-primary) scale-102"
                            : ""
                    }`}
                >
                    <div className="flex items-center justify-center text-(--color-text-muted)">
                        <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div>
                        <h3 className="font-medium">{item.model.name}</h3>
                        <p className="font-mono text-xs text-(--color-text-muted)">
                            {item.provider.name} / {item.model.code}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Badge>{formatNumber(item.stats.tokenUsage)} <span className="text-(--color-status-info)">tokens</span></Badge>
                        <Badge>{formatNumber(item.stats.successCount)} <span className="text-(--color-status-success)">ok</span></Badge>
                        <Badge>{formatNumber(item.stats.failureCount)} <span className="text-(--color-status-error)">fail</span></Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}
