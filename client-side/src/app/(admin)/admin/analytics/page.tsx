"use client";

import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { useGetAdminAnalyticsQuery } from "@/shared/store/features/api/roundhouseApi";

export default function AdminAnalyticsPage() {
    const { data } = useGetAdminAnalyticsQuery();
    const rows = [
        ["Users", data?.users ?? 0],
        ["API keys", data?.apiKeys ?? 0],
        ["Global providers", data?.globalProviders ?? 0],
        ["Custom providers", data?.customProviders ?? 0],
        ["Global models", data?.models ?? 0],
        ["Custom models", data?.userModels ?? 0],
        ["Provider selections", data?.providerSelections ?? 0],
        ["Linked key managers", data?.providerSelectionApiKeysManagers ?? 0],
    ];
    const max = Math.max(...rows.map(([, value]) => Number(value)), 1);

    return (
        <>
            <PageHeader title="Analytics" description="Platform-wide usage and distribution charts." />
            <Card>
                <CardHeader><h2 className="font-semibold tracking-tight">Operational Entity Mix</h2></CardHeader>
                <CardContent className="grid gap-4">
                    {rows.map(([label, value]) => (
                        <div key={label} className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <span>{label}</span>
                                <span className="font-mono font-semibold">{value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-(--color-bg-input)">
                                <div className="h-2 rounded-full bg-(--color-accent-primary)" style={{ width: `${(Number(value) / max) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </>
    );
}
