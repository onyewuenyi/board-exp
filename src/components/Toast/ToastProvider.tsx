"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "group flex items-center gap-3 w-full rounded-lg border border-border bg-card p-4 shadow-lg",
                    title: "text-sm font-medium text-foreground",
                    description: "text-xs text-muted-foreground",
                    actionButton:
                        "text-xs font-medium text-accent-linear hover:text-accent-linear/80 underline-offset-4 hover:underline",
                    cancelButton:
                        "text-xs text-muted-foreground hover:text-foreground",
                    success: "border-green-500/30 bg-green-500/10",
                    error: "border-red-500/30 bg-red-500/10",
                    warning: "border-amber-500/30 bg-amber-500/10",
                    info: "border-blue-500/30 bg-blue-500/10",
                },
            }}
        />
    );
}
