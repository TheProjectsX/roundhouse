import Link from "next/link";
import type { ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
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
        <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_210px]">
            <article className="min-w-0">
                <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 font-mono text-xs text-(--color-text-muted)">
                    <Link href="/" className="transition-colors hover:text-(--color-text-primary)">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/docs" className="transition-colors hover:text-(--color-text-primary)">
                        Docs
                    </Link>
                    {slug !== "introduction" ? (
                        <>
                            <span>/</span>
                            <span className="text-(--color-text-primary)">{page.title}</span>
                        </>
                    ) : null}
                </nav>

                <header className="border-b border-(--color-border-primary) pb-6">
                    <Badge className="mb-3">{page.category}</Badge>
                    <h1 className="text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
                        {page.title}
                    </h1>
                    <p className="mt-2 max-w-[68ch] text-base leading-7 text-(--color-text-secondary)">
                        {page.description}
                    </p>
                </header>

                <div className="mt-8 grid gap-10 text-[15px] leading-7 text-(--color-text-secondary) [&_p_a]:text-(--color-text-primary) [&_p_a]:underline [&_p_a]:underline-offset-4 [&_p_a:hover]:opacity-80 [&_li_a]:text-(--color-text-primary) [&_li_a]:underline [&_li_a]:underline-offset-4 [&_li_a:hover]:opacity-80 [&_code]:rounded-sm [&_code]:border [&_code]:border-(--color-border-subtle) [&_code]:bg-(--color-bg-card) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-(--color-text-primary) [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-(--color-text-primary) sm:[&_h2]:text-2xl [&_h3]:scroll-mt-24 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-(--color-text-primary) [&_li]:leading-7 [&_ol]:space-y-2.5 [&_p]:max-w-[65ch] [&_p]:leading-7 [&_strong]:font-semibold [&_strong]:text-(--color-text-primary) [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {children}
                </div>

                <nav
                    aria-label="Documentation pagination"
                    className="mt-12 grid gap-4 border-t border-(--color-border-primary) pt-8 sm:grid-cols-2"
                >
                    {adjacent.previous ? (
                        <Link
                            href={adjacent.previous.href}
                            className="group flex items-center gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4 transition-colors hover:border-(--color-border-focused) hover:bg-(--color-bg-card-hover)"
                        >
                            <CaretLeftIcon
                                size={18}
                                className="shrink-0 text-(--color-text-muted) transition-transform group-hover:-translate-x-0.5 group-hover:text-(--color-text-primary)"
                            />
                            <div className="min-w-0">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Previous
                                </p>
                                <p className="truncate font-semibold text-(--color-text-primary)">
                                    {adjacent.previous.title}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div />
                    )}
                    {adjacent.next ? (
                        <Link
                            href={adjacent.next.href}
                            className="group flex items-center justify-end gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-4 text-right transition-colors hover:border-(--color-border-focused) hover:bg-(--color-bg-card-hover)"
                        >
                            <div className="min-w-0">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-(--color-text-muted)">
                                    Next
                                </p>
                                <p className="truncate font-semibold text-(--color-text-primary)">
                                    {adjacent.next.title}
                                </p>
                            </div>
                            <CaretRightIcon
                                size={18}
                                className="shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5 group-hover:text-(--color-text-primary)"
                            />
                        </Link>
                    ) : null}
                </nav>
            </article>

            <aside className="hidden xl:block">
                <div className="sticky top-6 border-l border-(--color-border-primary) pl-4">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                        On this page
                    </p>
                    <nav className="mt-3 grid gap-2">
                        {page.sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="text-[13px] leading-5 text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary)"
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
