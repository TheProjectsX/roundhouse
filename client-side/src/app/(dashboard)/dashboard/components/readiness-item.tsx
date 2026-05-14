import React from "react";

interface ReadinessItemProps {
    item: React.ReactNode;
}

export function ReadinessItem({ item }: ReadinessItemProps) {
    return (
        <li className="flex items-center gap-3 rounded-md bg-(--color-bg-input) p-3">
            <span className="size-2 rounded-full bg-(--color-accent-primary)" />
            {item}
        </li>
    );
}
