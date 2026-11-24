import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { routes } from "@/shared/constants/routes";

export default function NotFound() {
    return (
        <main className="grid min-h-dvh place-items-center bg-(--color-bg-primary) p-6">
            <section className="w-full max-w-md rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-6">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-muted)">
                    404 // Route Not Found
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--color-text-primary)">
                    This route is outside the map.
                </h1>
                <p className="mt-2 text-sm text-(--color-text-secondary)">
                    The page may have moved or the requested resource no longer exists.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href={routes.dashboard}>Open Dashboard</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
