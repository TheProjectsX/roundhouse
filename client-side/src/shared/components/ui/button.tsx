import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focused) disabled:pointer-events-none disabled:opacity-50 not-disabled:active:scale-[0.98]",
    {
        variants: {
            variant: {
                primary:
                    "bg-(--color-accent-primary) text-(--color-text-inverse) not-disabled:hover:bg-(--color-accent-primary-hover)",

                secondary:
                    "border border-(--color-border-primary) bg-(--color-bg-card) text-(--color-text-primary) not-disabled:hover:bg-(--color-bg-card-hover)",

                success:
                    "bg-(--color-status-success) text-white not-disabled:hover:opacity-90",

                danger: "bg-(--color-status-error) text-white not-disabled:hover:opacity-90",

                ghost: "text-(--color-text-secondary) not-disabled:hover:bg-(--color-bg-card-hover) not-disabled:hover:text-(--color-text-primary)",

                blank: "bg-transparent text-(--color-text-primary) hover:bg-transparent",

                "primary:outline":
                    "border border-(--color-accent-primary) bg-transparent text-(--color-accent-primary) not-disabled:hover:bg-(--color-accent-primary) not-disabled:hover:text-(--color-text-inverse)",

                "secondary:outline":
                    "border border-(--color-border-primary) bg-transparent text-(--color-text-primary) not-disabled:hover:bg-(--color-border-primary) not-disabled:hover:text-white",

                "success:outline":
                    "border border-(--color-status-success) bg-transparent text-(--color-status-success) not-disabled:hover:bg-(--color-status-success) not-disabled:hover:text-white",

                "danger:outline":
                    "border border-(--color-status-error) bg-transparent text-(--color-status-error) not-disabled:hover:bg-(--color-status-error) not-disabled:hover:text-white",
                icon: "text-(--color-text-secondary) not-disabled:hover:text-(--color-text-primary)"
            },

            size: {
                xs: "min-h-8 px-2 !text-xs",
                sm: "min-h-8 px-3 !text-sm",
                md: "min-h-9 px-4 !text-base",
                lg: "min-h-10 px-5 !text-lg",

                icon: "size-10 p-0",
            },
        },

        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

export interface ButtonProps
    extends
        ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}
