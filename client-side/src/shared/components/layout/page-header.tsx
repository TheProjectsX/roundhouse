import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 border-b border-(--color-border-subtle) pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-(--color-text-primary)">{title}</h1>
                {description ? <p className="mt-1.5 max-w-[65ch] text-sm text-(--color-text-secondary)">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}
