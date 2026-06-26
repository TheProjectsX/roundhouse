import Link from "next/link";
import type { ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { getAdjacentDocs, getDocBySlug, type DocSlug } from "../docs-config";

type DocsContentProps = {
    slug: DocSlug;
    children: ReactNode;
};

export function DocsContent({ slug, children }: DocsContentProps) {
    const page = getDocBySlug(slug);
    const adjacent = getAdjacentDocs(slug);

    return (
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
            <article className="min-w-0">
                <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-(--color-text-muted)">
                    <Link
                        href="/"
                        className="transition-colors hover:text-(--color-text-primary)"
                    >
                        Home
                    </Link>
                    <span>/</span>
                    <Link
                        href="/docs"
                        className="transition-colors hover:text-(--color-text-primary)"
                    >
                        Docs
                    </Link>
                    {slug !== "introduction" ? (
                        <>
                            <span>/</span>
                            <span className="text-(--color-text-primary)">
                                {page.title}
                            </span>
                        </>
                    ) : null}
                </nav>

                <div className="mb-6 rounded-lg bg-amber-200 border-yellow-500 border-2 p-4 text-sm text-yellow-800 font-semibold">
                    <p>
                        I constructed the whole system but even <i>I</i> have no
                        fricking Idea what this Doc is about. If you can
                        understand, be my guest. Or give me a bit of time to
                        write something meaningful here.
                    </p>
                </div>
                <PageHeader
                    title={page.title}
                    description={page.description}
                    actions={<Badge>{page.category}</Badge>}
                />

                <div className="mt-8 grid gap-6 text-(--color-text-secondary) [&_a]:text-(--color-accent-primary) [&_a]:underline-offset-4 [&_a:hover]:underline [&_code]:rounded [&_code]:bg-[color-mix(in_srgb,var(--color-bg-card)_88%,var(--color-accent-secondary)_10%)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_code]:text-(--color-text-primary) [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-(--color-text-primary) [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-(--color-text-primary) [&_li]:leading-7 [&_p]:leading-7 [&_strong]:text-(--color-text-primary) [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-(--color-border-primary) [&_td]:px-3 [&_td]:py-3 [&_th]:border-b [&_th]:border-(--color-border-primary) [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-(--color-text-primary) [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {children}
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {adjacent.previous ? (
                        <Link href={adjacent.previous.href}>
                            <Card className="h-full transition-transform hover:-translate-y-0.5">
                                <CardContent className="flex h-full items-center gap-3 pt-5">
                                    <CaretLeftIcon size={18} />
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-(--color-text-muted)">
                                            Previous
                                        </p>
                                        <p className="font-semibold text-(--color-text-primary)">
                                            {adjacent.previous.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ) : (
                        <div />
                    )}
                    {adjacent.next ? (
                        <Link href={adjacent.next.href}>
                            <Card className="h-full transition-transform hover:-translate-y-0.5">
                                <CardContent className="flex h-full items-center justify-end gap-3 pt-5 text-right">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-(--color-text-muted)">
                                            Next
                                        </p>
                                        <p className="font-semibold text-(--color-text-primary)">
                                            {adjacent.next.title}
                                        </p>
                                    </div>
                                    <CaretRightIcon size={18} />
                                </CardContent>
                            </Card>
                        </Link>
                    ) : null}
                </div>
            </article>

            <aside className="hidden xl:block">
                <div className="sticky top-6 rounded-2xl border border-(--color-border-primary) bg-(--color-bg-card) p-5 shadow-(--color-shadow)">
                    <p className="text-sm font-semibold text-(--color-text-primary)">
                        On this page
                    </p>
                    <nav className="mt-4 grid gap-2">
                        {page.sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary)"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </div>
            </aside>
        </div>
    );
}
