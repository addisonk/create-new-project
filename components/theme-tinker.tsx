"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useControls, folder, Leva } from "leva";
import Color from "colorjs.io";
import type { ColorTokens } from "@/lib/config";

type LevaColor = string | { r: number; g: number; b: number; a: number };

function oklchToLeva(value: string): LevaColor {
  try {
    const c = new Color(value);
    const srgb = c.to("srgb");
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255)));
    const r = clamp(srgb.coords[0]);
    const g = clamp(srgb.coords[1]);
    const b = clamp(srgb.coords[2]);
    const a = c.alpha != null ? Math.round(c.alpha * 100) / 100 : 1;
    if (a < 1) return { r, g, b, a };
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return "#888888";
  }
}

const COLOR_KEYS = [
  "background", "foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "accent", "accent-foreground",
  "muted", "muted-foreground",
  "destructive",
  "border", "input", "ring",
  "card", "card-foreground",
  "chart-1", "chart-2", "chart-3",
];

function buildColorSchema(
  tokens: Record<string, string>,
  mode: "light" | "dark"
): Record<string, unknown> {
  const schema: Record<string, unknown> = {};
  const prefix = mode === "dark" ? "dk:" : "";
  for (const key of COLOR_KEYS) {
    const raw = tokens[key];
    if (!raw) continue;
    schema[`${prefix}${key}`] = {
      value: oklchToLeva(raw),
      label: key,
    };
  }
  return schema;
}

function useThemeTinker(colorTokens: ColorTokens) {
  const lightSchema = buildColorSchema(colorTokens.light, "light");
  const darkSchema = buildColorSchema(colorTokens.dark, "dark");
  const userEdited = useRef<Set<string>>(new Set());
  const prevValues = useRef<Record<string, unknown>>({});

  const [values] = useControls(() => ({
    "Light Mode": folder(lightSchema, { collapsed: true }),
    "Dark Mode": folder(darkSchema, { collapsed: true }),
    "Radius": {
      value: 0.625,
      min: 0,
      max: 2,
      step: 0.025,
      label: "Radius (rem)",
      onChange: (v: number) => {
        document.documentElement.style.setProperty("--radius", `${v}rem`);
      },
    },
  }), []);

  // Apply overrides for the current mode only
  const applyOverrides = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");

    // Clear ALL color overrides first
    for (const key of COLOR_KEYS) {
      document.documentElement.style.removeProperty(`--${key}`);
    }

    // Re-apply only user-edited values matching current mode
    for (const editedKey of userEdited.current) {
      const cssKey = editedKey.startsWith("dk:") ? editedKey.slice(3) : editedKey;
      const isForDark = editedKey.startsWith("dk:");

      if ((isDark && isForDark) || (!isDark && !isForDark)) {
        const val = values[editedKey];
        if (!val) continue;

        if (typeof val === "object" && "r" in val) {
          const { r, g, b, a } = val as { r: number; g: number; b: number; a: number };
          document.documentElement.style.setProperty(`--${cssKey}`, `rgba(${r}, ${g}, ${b}, ${a ?? 1})`);
        } else if (typeof val === "string") {
          try {
            const c = new Color(val);
            const oklch = c.to("oklch");
            document.documentElement.style.setProperty(
              `--${cssKey}`,
              `oklch(${oklch.coords[0]?.toFixed(3)} ${oklch.coords[1]?.toFixed(3)} ${oklch.coords[2]?.toFixed(1)})`
            );
          } catch {
            document.documentElement.style.setProperty(`--${cssKey}`, val);
          }
        }
      }
    }
  }, [values]);

  // Track user edits
  useEffect(() => {
    for (const [key, val] of Object.entries(values)) {
      if (!val || key === "Radius") continue;
      const prev = prevValues.current[key];
      if (prev !== undefined && JSON.stringify(prev) !== JSON.stringify(val)) {
        userEdited.current.add(key);
      }
    }
    prevValues.current = { ...values };
    applyOverrides();
  }, [values, applyOverrides]);

  // Clear and re-apply when dark mode toggles
  useEffect(() => {
    const observer = new MutationObserver(() => applyOverrides());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [applyOverrides]);
}

export function ThemeTinker({
  enabled,
  colorTokens,
}: {
  enabled: boolean;
  colorTokens: ColorTokens;
}) {
  useThemeTinker(colorTokens);
  return <Leva hidden={!enabled} collapsed={false} />;
}
