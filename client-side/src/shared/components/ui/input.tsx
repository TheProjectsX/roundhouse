import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "min-h-9 w-full rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none transition-colors placeholder:text-(--color-text-muted) focus:border-(--color-border-focused) focus:ring-1 focus:ring-(--color-border-focused)",
                className,
            )}
            {...props}
        />
    );
}
