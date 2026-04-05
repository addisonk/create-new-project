"use client"

// Default: lucide-react. The /create-new-project skill swaps this import
// to match the project's iconLibrary from components.json.
// lucide → import * as Icons from "lucide-react" / LIBRARY_KEY = "lucide"
// tabler → import * as Icons from "@tabler/icons-react" / LIBRARY_KEY = "tabler"
// phosphor → import * as Icons from "@phosphor-icons/react" / LIBRARY_KEY = "phosphor"
// remixicon → import * as Icons from "@remixicon/react" / LIBRARY_KEY = "remixicon"
import * as Icons from "lucide-react"
const LIBRARY_KEY = "lucide"

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
