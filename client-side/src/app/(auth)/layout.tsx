import Link from "next/link";
import { routes } from "@/shared/constants/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="relative flex min-h-dvh flex-col bg-(--color-bg-primary)">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--color-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--color-border-subtle)_1px,transparent_1px)] bg-size-[48px_48px] opacity-45" />
            <header className="relative z-10 flex h-14 items-center justify-between border-b border-(--color-border-primary) bg-(--color-bg-secondary) px-6">
                <Link href="/" className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-secondary) hover:text-(--color-text-primary)">
                    Roundhouse // Console
                </Link>
                <Link href={routes.docs} className="text-xs font-medium text-(--color-text-secondary) hover:text-(--color-text-primary)">
                    Docs
                </Link>
            </header>
            <div className="relative z-10 grid flex-1 place-items-center p-6">
                <div className="w-full">{children}</div>
            </div>
        </main>
    );
}
