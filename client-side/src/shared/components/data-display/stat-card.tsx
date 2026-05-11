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
            <CardContent className="flex items-start justify-between pt-5">
                <div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
                    <p className="mt-3 font-mono text-3xl font-bold tracking-tight">{formatNumber(value)}</p>
                </div>
                {IconComponent ? (
                    <div className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-[var(--color-accent-primary)]">
                        <IconComponent size={20} weight="duotone" />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
