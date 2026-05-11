import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "min-h-10 w-full rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none transition-colors placeholder:text-(--color-text-muted) focus:border-(--color-border-focused) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-border-focused)_25%,transparent)]",
                className,
            )}
            {...props}
        />
    );
}
