"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type IconLibrary = "lucide" | "tabler" | "hugeicons" | "phosphor" | "remixicon"

const PACKAGE_MAP: Record<IconLibrary, string> = {
  lucide: "lucide-react",
  tabler: "@tabler/icons-react",
  hugeicons: "@hugeicons/core-free-icons",
  phosphor: "@phosphor-icons/react",
  remixicon: "@remixicon/react",
}

interface IconContextValue {
  library: IconLibrary
  icons: Record<string, React.ComponentType<{ className?: string }>>
}

const IconContext = createContext<IconContextValue>({
  library: "lucide",
  icons: {},
})

export function IconProvider({
  library,
  children,
}: {
  library: string
  children: React.ReactNode
}) {
  const lib = (library || "lucide") as IconLibrary
  const [icons, setIcons] = useState<Record<string, React.ComponentType<{ className?: string }>>>({})

  useEffect(() => {
    const pkg = PACKAGE_MAP[lib]
    if (!pkg) return

    import(/* @vite-ignore */ pkg)
      .then((mod) => setIcons(mod as Record<string, React.ComponentType<{ className?: string }>>))
      .catch(() => {
        // Fallback to lucide if the library isn't installed
        if (lib !== "lucide") {
          import("lucide-react").then((mod) =>
            setIcons(mod as unknown as Record<string, React.ComponentType<{ className?: string }>>)
          )
        }
      })
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
