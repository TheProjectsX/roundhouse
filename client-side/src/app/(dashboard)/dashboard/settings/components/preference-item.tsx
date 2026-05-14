import React from "react";

interface PreferenceItemProps {
    icon: any;
    label: string;
    value: string;
}

export function PreferenceItem({ icon: Icon, label, value }: PreferenceItemProps) {
    return (
        <div className="flex items-center justify-between rounded-md bg-(--color-bg-input) p-3">
            <span className="flex items-center gap-2">
                <Icon size={17} /> {label}
            </span>
            <span className="text-(--color-text-secondary)">{value}</span>
        </div>
    );
}
