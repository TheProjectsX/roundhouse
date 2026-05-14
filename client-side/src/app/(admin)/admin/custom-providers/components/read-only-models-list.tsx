import React from "react";
import { useGetAdminProviderModelsQuery } from "@/shared/store/features/api/roundhouseApi";
import { ReadOnlyModelRow } from "./read-only-model-row";

interface ReadOnlyModelsListProps {
    providerId: string;
}

export function ReadOnlyModelsList({ providerId }: ReadOnlyModelsListProps) {
    const { data: models = [], isLoading } =
        useGetAdminProviderModelsQuery(providerId);

    if (isLoading) {
        return (
            <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)] p-12 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                    Loading models...
                </p>
            </div>
        );
    }

    return (
        <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)]">
            <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({models.length})
                </h3>
            </div>

            <div className="px-6 pb-6">
                <div className="overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_30%,transparent)]">
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Name
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Code
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Max Tokens
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Efficiency
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Success / Failure
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-(--color-text-secondary)">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {models.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-(--color-text-muted)"
                                    >
                                        No models found for this provider.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model: any) => (
                                    <ReadOnlyModelRow
                                        key={model.id}
                                        model={model}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
