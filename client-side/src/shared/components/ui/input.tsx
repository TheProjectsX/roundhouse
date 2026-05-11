import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focused)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-border-focused)_25%,transparent)]",
                className,
            )}
            {...props}
        />
    );
}
