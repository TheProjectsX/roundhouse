"use client";

import { Button } from "@/shared/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="grid min-h-dvh place-items-center bg-[var(--color-bg-primary)] p-6">
            <section className="max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-lg shadow-[var(--color-shadow)]">
                <p className="text-sm font-medium text-[var(--color-status-error)]">Something went wrong</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">Roundhouse could not render this view.</h1>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{error.message}</p>
                <Button className="mt-6" onClick={reset}>
                    Try again
                </Button>
            </section>
        </main>
    );
}
