'use client';

import { cn } from "@/lib/utils";
import { Coffee } from "lucide-react";

export function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center", className)}>
            <h1
                className="text-5xl text-secondary inline-flex items-center"
                style={{ fontFamily: "var(--font-lobster-two)" }}
            >
                Meja
                <Coffee className="h-6 w-6" />
                <span className="text-primary font-bold">Hub</span>
            </h1>
        </div>
    )
}
