"use client";

import { useEffect, useRef, useState } from "react";
import { useControls, folder, Leva } from "leva";
import Color from "colorjs.io";

const TOKEN_NAMES = [
  "--background", "--foreground",
  "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--accent", "--accent-foreground",
  "--muted", "--muted-foreground",
  "--destructive",
  "--border", "--ring",
  "--card", "--card-foreground",
  "--chart-1", "--chart-2", "--chart-3",
] as const;

function cssToHex(value: string): string {
  try {
    const c = new Color(value);
    const srgb = c.to("srgb");
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, "0");
    return `#${toHex(srgb.coords[0])}${toHex(srgb.coords[1])}${toHex(srgb.coords[2])}`;
  } catch {
    return "#000000";
  }
}

function hexToOklch(hex: string): string {
  try {
    const c = new Color(hex);
    const oklch = c.to("oklch");
    return `oklch(${oklch.coords[0]?.toFixed(3)} ${oklch.coords[1]?.toFixed(3)} ${oklch.coords[2]?.toFixed(1)})`;
  } catch {
    return hex;
  }
}

function readTokensForMode(mode: "light" | "dark"): Record<string, string> {
  if (typeof window === "undefined") return {};
  const tokens: Record<string, string> = {};

  // Temporarily force the mode to read its values
  const html = document.documentElement;
  const wasDark = html.classList.contains("dark");

  if (mode === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  const style = getComputedStyle(html);
  for (const name of TOKEN_NAMES) {
    tokens[name] = cssToHex(style.getPropertyValue(name).trim());
  }
  tokens["--radius"] = style.getPropertyValue("--radius").trim();

  // Restore original mode
  if (wasDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  return tokens;
}

function useThemeTinker() {
  const [lightDefaults, setLightDefaults] = useState<Record<string, string>>({});
  const [darkDefaults, setDarkDefaults] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Remove any overrides before reading
    for (const name of TOKEN_NAMES) {
      document.documentElement.style.removeProperty(name);
    }

    setLightDefaults(readTokensForMode("light"));
    setDarkDefaults(readTokensForMode("dark"));
    setMounted(true);
  }, []);

  // Build schemas for both modes
  const lightSchema: Record<string, unknown> = {};
  const darkSchema: Record<string, unknown> = {};

  for (const name of TOKEN_NAMES) {
    const label = name.replace("--", "");
    lightSchema[label] = {
      value: lightDefaults[name] ?? "#000000",
      onChange: (hex: string) => {
        // Only apply if we're currently in light mode
        if (!document.documentElement.classList.contains("dark")) {
          document.documentElement.style.setProperty(name, hexToOklch(hex));
        }
      },
    };
    darkSchema[label] = {
      value: darkDefaults[name] ?? "#000000",
      onChange: (hex: string) => {
        // Only apply if we're currently in dark mode
        if (document.documentElement.classList.contains("dark")) {
          document.documentElement.style.setProperty(name, hexToOklch(hex));
        }
      },
    };
  }

  useControls(
    {
      "Light Mode": folder(lightSchema, { collapsed: false }),
      "Dark Mode": folder(darkSchema, { collapsed: true }),
      Radius: {
        value: parseFloat(lightDefaults["--radius"] || "0.625"),
        min: 0,
        max: 2,
        step: 0.025,
        label: "Radius (rem)",
        onChange: (v: number) => {
          document.documentElement.style.setProperty("--radius", `${v}rem`);
        },
      },
    },
    [mounted]
  );
}

export function ThemeTinker({ enabled }: { enabled: boolean }) {
  useThemeTinker();
  return <Leva hidden={!enabled} collapsed={false} />;
}
