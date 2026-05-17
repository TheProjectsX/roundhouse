"use client";

import { useState } from "react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useGetAdminProvidersQuery } from "@/shared/store/features/admin/adminApi";
import { CustomProviderCard } from "./components/custom-provider-card";

export default function CustomProvidersPage() {
    const { data: providers = [], isLoading } = useGetAdminProvidersQuery({
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
                {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton key={index} className="h-48 rounded-2xl" />
                      ))
                    : null}
                {!isLoading && providers.length === 0 ? (
                    <EmptyState
                        title="No custom providers found"
                        description="User-created providers will appear here for admin review once they are added from the user dashboard."
                    />
                ) : (
                    !isLoading &&
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
