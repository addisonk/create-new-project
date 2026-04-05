"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import * as LucideIcons from "lucide-react"

type IconLibrary = "lucide" | "tabler" | "hugeicons" | "phosphor" | "remixicon"

interface IconContextValue {
  library: IconLibrary
  icons: Record<string, React.ComponentType<{ className?: string }>>
}

const IconContext = createContext<IconContextValue>({
  library: "lucide",
  icons: {},
})

// Lucide is always available as the default/fallback
const lucideIcons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>

export function IconProvider({
  library,
  children,
}: {
  library: string
  children: React.ReactNode
}) {
  const lib = (library || "lucide") as IconLibrary
  const [icons, setIcons] = useState<Record<string, React.ComponentType<{ className?: string }>>>(lucideIcons)

  useEffect(() => {
    // Lucide is always loaded synchronously — no dynamic import needed
    if (lib === "lucide") {
      setIcons(lucideIcons)
      return
    }

    // For other libraries, try dynamic import — they may not be installed
    // Using string literals so Next.js can handle them properly
    const loadLibrary = async () => {
      try {
        let mod: Record<string, unknown>
        if (lib === "tabler") mod = await import("@tabler/icons-react")
        else if (lib === "phosphor") mod = await import("@phosphor-icons/react")
        else if (lib === "remixicon") mod = await import("@remixicon/react")
        else { setIcons(lucideIcons); return }
        setIcons(mod as unknown as Record<string, React.ComponentType<{ className?: string }>>)
      } catch {
        // Library not installed — fall back to lucide
        setIcons(lucideIcons)
      }
    }
    loadLibrary()
  }, [lib])

  return (
    <IconContext.Provider value={{ library: lib, icons }}>
      {children}
    </IconContext.Provider>
  )
}

export function useIcons() {
  return useContext(IconContext)
}
