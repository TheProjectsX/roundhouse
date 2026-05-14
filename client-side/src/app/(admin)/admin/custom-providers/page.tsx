"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useGetAdminProvidersQuery } from "@/shared/store/features/api/roundhouseApi";
import { CustomProviderCard } from "./components/custom-provider-card";

export default function CustomProvidersPage() {
    const { data: providers = [] } = useGetAdminProvidersQuery({
        customOnly: true,
    });
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );

    return (
        <>
            <PageHeader
                title="Custom Providers"
                description="Monitor providers created by platform users. Admins have read-only access to user-created resources."
            />

            <section className="grid gap-6">
                {providers.length === 0 ? (
                    <Card>
                        <CardContent className="flex h-40 items-center justify-center text-(--color-text-muted)">
                            No custom providers found.
                        </CardContent>
                    </Card>
                ) : (
                    providers.map((provider: any) => (
                        <CustomProviderCard
                            key={provider.id}
                            provider={provider}
                            isExpanded={expandedProviderId === provider.id}
                            onToggleExpand={() =>
                                setExpandedProviderId(
                                    expandedProviderId === provider.id
                                        ? null
                                        : provider.id,
                                )
                            }
                        />
                    ))
                )}
            </section>
        </>
    );
}
