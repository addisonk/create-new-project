"use client"

import * as LucideIcons from "lucide-react"

export function IconPlaceholder({ lucide, className, ...props }: { lucide?: string; className?: string; [key: string]: unknown }) {
  if (lucide) {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[lucide]
    if (Icon) return <Icon className={className} />
  }
  return <div className={className} />
}
