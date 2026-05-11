import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function NotFound() {
    return (
        <main className="grid min-h-dvh place-items-center bg-(--color-bg-primary) p-6">
            <section className="max-w-md rounded-lg border border-(--color-border-primary) bg-(--color-bg-card) p-6">
                <p className="text-sm font-medium text-(--color-accent-primary)">404</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">This route is outside the map.</h1>
                <p className="mt-3 text-sm text-(--color-text-secondary)">The page may have moved or the entity may no longer exist.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Back to dashboard</Link>
                </Button>
            </section>
        </main>
    );
}
