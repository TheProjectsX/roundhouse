import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatNumber } from "@/shared/lib/utils";

interface StatCardProps {
    label: string;
    value: number;
    icon?: Icon;
}

export function StatCard({ label, value, icon: IconComponent }: StatCardProps) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between p-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                        {label}
                    </p>
                    <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-(--color-text-primary)">
                        {formatNumber(value)}
                    </p>
                </div>
                {IconComponent ? (
                    <div className="grid size-8 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) text-(--color-text-secondary)">
                        <IconComponent size={16} weight="regular" />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
