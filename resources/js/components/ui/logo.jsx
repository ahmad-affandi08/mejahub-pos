'use client';

import { cn } from "@/lib/utils";
import { Coffee } from "lucide-react";

export function Logo({ className, textClassName, iconClassName, accentClassName }) {
    return (
        <div className={cn("flex items-center", className)}>
            <h1
                className={cn("inline-flex items-center gap-1 text-5xl text-secondary", textClassName)}
                style={{ fontFamily: "var(--font-lobster-two)" }}
            >
                Meja
                <Coffee className={cn("h-6 w-6", iconClassName)} />
                <span className={cn("font-bold text-primary", accentClassName)}>Hub</span>
            </h1>
        </div>
    );
}
