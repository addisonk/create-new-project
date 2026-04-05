"use client";

import { useEffect, useRef, useState } from "react";
import { useControls, Leva } from "leva";
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

function readTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const style = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  for (const name of TOKEN_NAMES) {
    const raw = style.getPropertyValue(name).trim();
    tokens[name] = cssToHex(raw);
  }
  // Read radius as a number
  tokens["--radius"] = style.getPropertyValue("--radius").trim();
  return tokens;
}

function useThemeTinker() {
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const userEdited = useRef<Set<string>>(new Set());

  // Read tokens and re-read on dark mode toggle
  useEffect(() => {
    const read = () => {
      // Remove any user overrides before reading defaults
      for (const name of TOKEN_NAMES) {
        document.documentElement.style.removeProperty(name);
      }
      document.documentElement.style.removeProperty("--radius");
      userEdited.current.clear();
      setDefaults(readTokens());
    };
    read();
    setMounted(true);

    // Watch for dark mode toggle (class change on <html>)
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Build Leva schema from defaults
  const colorSchema: Record<string, unknown> = {};
  for (const name of TOKEN_NAMES) {
    const label = name.replace("--", "");
    colorSchema[label] = { value: defaults[name] ?? "#000000" };
  }

  const [values, set] = useControls(
    "Colors",
    () => colorSchema,
    { collapsed: false },
    [mounted]
  );

  const [radiusValues] = useControls(
    "Layout",
    () => ({
      radius: {
        value: parseFloat(defaults["--radius"] || "0.625"),
        min: 0,
        max: 2,
        step: 0.025,
        label: "Radius (rem)",
      },
    }),
    { collapsed: false },
    [mounted]
  );

  // Sync Leva values when defaults change (dark mode toggle)
  useEffect(() => {
    if (Object.keys(defaults).length > 0) {
      const update: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const label = name.replace("--", "");
        update[label] = defaults[name] ?? "#000000";
      }
      set(update);
    }
  }, [defaults, set]);

  // Apply user edits to CSS
  const prevValues = useRef<Record<string, unknown>>({});
  useEffect(() => {
    for (const [key, val] of Object.entries(values)) {
      if (!val) continue;
      const prev = prevValues.current[key];
      const def = defaults[`--${key}`];
      const valStr = JSON.stringify(val);
      const prevStr = JSON.stringify(prev);

      // Track if user manually changed this
      if (prev !== undefined && prevStr !== valStr && val !== def) {
        userEdited.current.add(key);
      }

      // Only apply user-edited values
      if (userEdited.current.has(key) && typeof val === "string") {
        // Convert hex back to oklch for CSS
        try {
          const c = new Color(val);
          const oklch = c.to("oklch");
          const l = oklch.coords[0]?.toFixed(3) ?? "0";
          const ch = oklch.coords[1]?.toFixed(3) ?? "0";
          const h = oklch.coords[2]?.toFixed(1) ?? "0";
          document.documentElement.style.setProperty(`--${key}`, `oklch(${l} ${ch} ${h})`);
        } catch {
          document.documentElement.style.setProperty(`--${key}`, val);
        }
      }
    }
    prevValues.current = { ...values };
  }, [values, defaults]);

  // Apply radius
  useEffect(() => {
    if (radiusValues.radius !== parseFloat(defaults["--radius"] || "0.625")) {
      document.documentElement.style.setProperty("--radius", `${radiusValues.radius}rem`);
    }
  }, [radiusValues.radius, defaults]);
}

export function ThemeTinker({ enabled }: { enabled: boolean }) {
  useThemeTinker();
  return <Leva hidden={!enabled} collapsed={false} />;
}
