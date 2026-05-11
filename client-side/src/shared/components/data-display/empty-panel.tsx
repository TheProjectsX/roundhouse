import { Card, CardContent } from "@/shared/components/ui/card";

interface EmptyPanelProps {
    title: string;
    description: string;
}

export function EmptyPanel({ title, description }: EmptyPanelProps) {
    return (
        <Card>
            <CardContent className="pt-5">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 max-w-[65ch] text-sm text-[var(--color-text-secondary)]">{description}</p>
            </CardContent>
        </Card>
    );
}
