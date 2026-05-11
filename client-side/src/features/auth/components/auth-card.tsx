import type { ReactNode } from "react";

interface AuthCardProps {
    eyebrow?: string;
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthCard({ eyebrow = "Roundhouse", title, description, children }: AuthCardProps) {
    return (
        <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl shadow-[var(--color-shadow)]">
            <div className="mb-6">
                <p className="text-sm font-semibold text-[var(--color-accent-primary)]">{eyebrow}</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
            </div>
            {children}
        </section>
    );
}
