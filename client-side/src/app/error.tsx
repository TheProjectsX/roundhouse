"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { routes } from "@/shared/constants/routes";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="grid min-h-dvh place-items-center bg-(--color-bg-primary) p-6">
            <section className="w-full max-w-md rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-6">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--color-status-error)">
                    Runtime Error
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--color-text-primary)">
                    Roundhouse could not render this view.
                </h1>
                <p className="mt-2 text-sm text-(--color-text-secondary)">
                    {error.message || "An unexpected client error occurred."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={reset}>Try again</Button>
                    <Button asChild variant="secondary">
                        <Link href={routes.dashboard}>Open Dashboard</Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
