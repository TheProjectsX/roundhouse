import React from "react";
import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Metric } from "./metric";

interface RoutingAnalyticsProps {
    analytics: {
        providerSelections: number;
        activeProviders: number;
        vaultKeys: number;
        activeModels: number;
    };
}

export function RoutingAnalytics({ analytics }: RoutingAnalyticsProps) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                        <SlidersHorizontalIcon size={20} /> Routing Analytics
                    </h2>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Quick readout of how this API key is wired right now.
                    </p>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
                <Metric
                    label="Provider selections"
                    value={analytics.providerSelections}
                />
                <Metric
                    label="Active providers"
                    value={analytics.activeProviders}
                />
                <Metric label="Vault keys" value={analytics.vaultKeys} />
                <Metric label="Active models" value={analytics.activeModels} />
            </CardContent>
        </Card>
    );
}
