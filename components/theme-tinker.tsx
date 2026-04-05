"use client";

import { useEffect } from "react";
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

function hexToOklch(hex: string): string {
  try {
    const c = new Color(hex);
    const oklch = c.to("oklch");
    return `oklch(${oklch.coords[0]?.toFixed(3)} ${oklch.coords[1]?.toFixed(3)} ${oklch.coords[2]?.toFixed(1)})`;
  } catch {
    return hex;
  }
}

const COLOR_KEYS = [
  "background", "foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "accent", "accent-foreground",
  "muted", "muted-foreground",
  "destructive",
  "border", "ring",
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
      onChange: (val: LevaColor) => {
        const isDark = document.documentElement.classList.contains("dark");
        const currentMode = isDark ? "dark" : "light";
        if (currentMode === mode) {
          if (typeof val === "object" && "r" in val) {
            document.documentElement.style.setProperty(
              `--${key}`,
              `rgba(${val.r}, ${val.g}, ${val.b}, ${val.a ?? 1})`
            );
          } else if (typeof val === "string") {
            document.documentElement.style.setProperty(`--${key}`, hexToOklch(val));
          }
        }
      },
    };
  }
  return schema;
}

function useThemeTinker(colorTokens: ColorTokens) {
  const lightSchema = buildColorSchema(colorTokens.light, "light");
  const darkSchema = buildColorSchema(colorTokens.dark, "dark");

  useControls({
    "Light Mode": folder(lightSchema, { collapsed: false }),
    "Dark Mode": folder(darkSchema, { collapsed: true }),
    "Radius": {
      value: typeof window !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--radius")) || 0.625
        : 0.625,
      min: 0,
      max: 2,
      step: 0.025,
      label: "Radius (rem)",
      onChange: (v: number) => {
        document.documentElement.style.setProperty("--radius", `${v}rem`);
      },
    },
  });
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
