"use client"

import { useIcons } from "@/components/icon-context"

export function IconPlaceholder({
  className,
  ...props
}: {
  className?: string
  lucide?: string
  tabler?: string
  hugeicons?: string
  phosphor?: string
  remixicon?: string
  [key: string]: unknown
}) {
  const { library, icons } = useIcons()
  const iconName = props[library] as string | undefined

  if (iconName && icons[iconName]) {
    const Icon = icons[iconName]
    return <Icon className={className} />
  }
  return <div className={className} />
}
