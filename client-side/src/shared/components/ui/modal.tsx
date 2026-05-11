"use client";

import { X } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/utils";

type ModalProps = {
    children: ReactNode;
    onClose?: () => void;
    ariaLabel: string;
    className?: string;
    overlayClassName?: string;
    showCloseButton?: boolean;
    closeOnEscape?: boolean;
};

export function Modal({
    children,
    onClose,
    ariaLabel,
    className,
    overlayClassName,
    showCloseButton = false,
    closeOnEscape = true,
}: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mounted]);

    useEffect(() => {
        if (!onClose || !closeOnEscape) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-50 grid place-items-center bg-(--color-bg-overlay) p-4 cursor-pointer",
                overlayClassName,
            )}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                onClose?.();
            }}
        >
            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-lg border border-(--color-border-primary) bg-(--color-bg-secondary) shadow-(--color-shadow) cursor-default",
                    className,
                )}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {showCloseButton && onClose ? (
                    <button
                        type="button"
                        aria-label="Close modal"
                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-(--color-border-primary) bg-(--color-bg-input) text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                ) : null}
                {children}
            </div>
        </div>,
        document.body,
    );
}