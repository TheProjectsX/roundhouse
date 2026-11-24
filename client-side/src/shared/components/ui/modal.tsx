"use client";

import { XIcon } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
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

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const previousActive = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const panel = panelRef.current;
        if (panel) {
            const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (first ?? panel).focus();
        }

        return () => {
            document.body.style.overflow = previousOverflow;
            previousActive?.focus?.();
        };
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && onClose && closeOnEscape) {
                onClose();
                return;
            }
            if (event.key === "Tab" && panelRef.current) {
                const focusables = Array.from(
                    panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mounted, closeOnEscape, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-50 grid place-items-center bg-(--color-bg-overlay) p-4",
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
                ref={panelRef}
                tabIndex={-1}
                className={cn(
                    "relative w-full overflow-hidden rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) outline-none",
                    className,
                )}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {showCloseButton && onClose ? (
                    <button
                        type="button"
                        aria-label="Close modal"
                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-card) text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        onClick={onClose}
                    >
                        <XIcon size={16} />
                    </button>
                ) : null}
                {children}
            </div>
        </div>,
        document.body,
    );
}
