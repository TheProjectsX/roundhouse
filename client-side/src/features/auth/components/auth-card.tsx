import Image from "next/image";
import type { ReactNode } from "react";

interface AuthCardProps {
    eyebrow?: string;
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthCard({ eyebrow = "Roundhouse", title, description, children }: AuthCardProps) {
    return (
        <section className="w-full max-w-md rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-6">
            <div className="mb-6 border-b border-(--color-border-subtle) pb-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="Roundhouse"
                            width={24}
                            height={24}
                            className="rounded-sm border border-(--color-border-primary)"
                        />
                        <span className="text-sm font-semibold text-(--color-text-primary)">
                            {eyebrow}
                        </span>
                    </div>
                </div>
                <h1 className="mt-4 text-xl font-semibold tracking-tight text-(--color-text-primary)">{title}</h1>
                <p className="mt-1.5 text-sm text-(--color-text-secondary)">{description}</p>
            </div>
            {children}
        </section>
    );
}
