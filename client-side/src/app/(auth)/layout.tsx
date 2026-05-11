export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-(--color-bg-primary) p-6">
            <div className="absolute inset-0 bg-[linear-gradient(var(--color-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--color-border-subtle)_1px,transparent_1px)] bg-size-[48px_48px] opacity-60" />
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--color-accent-primary)_18%,transparent),transparent_60%)]" />
            <div className="relative z-10 w-full">{children}</div>
        </main>
    );
}
