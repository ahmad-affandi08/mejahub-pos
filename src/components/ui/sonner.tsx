"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ position = "top-center", ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      offset={16}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group relative overflow-hidden rounded-xl border border-border/80 bg-popover/95 px-4 py-3 text-popover-foreground shadow-xl ring-1 ring-foreground/5 backdrop-blur supports-[backdrop-filter]:bg-popover/80 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-secondary",
          title: "font-semibold tracking-tight",
          description: "mt-1 text-muted-foreground",
          content: "pl-2",
          closeButton:
            "border-border/70 bg-background/80 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          success: "!border-primary/30 !before:bg-primary",
          error: "!border-destructive/40 !before:bg-destructive",
          warning: "!border-secondary !before:bg-secondary",
          info: "!border-border !before:bg-border",
          loading: "!border-border !before:bg-border",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
