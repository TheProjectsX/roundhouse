import { BookOpen, Code, GitBranch, Key } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";

const docs = [
    { icon: Key, title: "Authentication", body: "Send Roundhouse keys as Bearer tokens to the unified /v1 endpoint." },
    { icon: GitBranch, title: "Routing Methods", body: "Choose RANDOM, EFFICIENCY, or PRIORITY per API key to control model selection." },
    { icon: Code, title: "OpenAI Compatibility", body: "Use existing OpenAI SDK clients by changing only the base URL and API key." },
    { icon: BookOpen, title: "Failover Semantics", body: "Failed models are excluded from the active request cycle before the next retry attempt." },
];

export default function DocsPage() {
    return (
        <main className="mx-auto grid min-h-dvh max-w-[1100px] gap-8 bg-(--color-bg-primary) px-4 py-8 lg:px-6">
            <PageHeader title="Documentation" description="Guides for the OpenAI-compatible Roundhouse API surface." />
            <section className="grid gap-5 md:grid-cols-2">
                {docs.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.title}>
                            <CardContent className="flex gap-4 pt-5">
                                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-(--color-accent-primary)">
                                    <Icon size={20} weight="duotone" />
                                </div>
                                <div>
                                    <h2 className="font-semibold tracking-tight">{item.title}</h2>
                                    <p className="mt-1 text-sm text-(--color-text-secondary)">{item.body}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>
        </main>
    );
}
