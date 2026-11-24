import React from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmModal({
    title,
    description,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <Modal
            onClose={onCancel}
            ariaLabel={title}
            showCloseButton
            className="w-full max-w-md"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    {description}
                </p>
            </div>
            <div className="flex justify-end gap-2 p-5">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant="danger"
                    onClick={onConfirm}
                    disabled={isLoading}
                >
                    {isLoading ? "Working..." : confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
