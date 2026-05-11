import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focused)] disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                primary: "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-primary-hover)]",
                secondary: "border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]",
                ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]",
                danger: "bg-[var(--color-status-error)] text-white hover:opacity-90",
            },
            size: {
                sm: "min-h-9 px-3 text-xs",
                md: "min-h-10 px-4 text-sm",
                lg: "min-h-11 px-5 text-base",
                icon: "size-10 p-0",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
