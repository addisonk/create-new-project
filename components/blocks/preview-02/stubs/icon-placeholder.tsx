"use client"

// Default: lucide. The create-new-project skill updates this import
// to match the project's iconLibrary from components.json.
// Supported: lucide-react, @tabler/icons-react, @phosphor-icons/react, @remixicon/react
// For hugeicons: uses @hugeicons/core-free-icons with HugeiconsIcon wrapper
import * as Icons from "lucide-react"

// Which prop to read from the icon map (matches the import above)
const LIBRARY_KEY = "lucide" as const

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
  const iconName = props[LIBRARY_KEY] as string | undefined
  if (iconName) {
    const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
    if (Icon) return <Icon className={className} />
  }
  return <div className={className} />
}
