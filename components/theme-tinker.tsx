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
  "destructive", "destructive-foreground",
  "border", "input", "ring",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground",
  "sidebar-border", "sidebar-ring",
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

// ─── Font options from shadcn ───
const SANS_FONTS: Record<string, string> = {
  "Geist": "Geist",
  "Inter": "Inter",
  "DM Sans": "DM+Sans",
  "Noto Sans": "Noto+Sans",
  "Nunito Sans": "Nunito+Sans",
  "Figtree": "Figtree",
  "Roboto": "Roboto",
  "Raleway": "Raleway",
  "Public Sans": "Public+Sans",
  "Outfit": "Outfit",
  "Manrope": "Manrope",
  "Space Grotesk": "Space+Grotesk",
  "Montserrat": "Montserrat",
  "IBM Plex Sans": "IBM+Plex+Sans",
  "Source Sans 3": "Source+Sans+3",
  "Instrument Sans": "Instrument+Sans",
  "Oxanium": "Oxanium",
};

const SERIF_FONTS: Record<string, string> = {
  "Noto Serif": "Noto+Serif",
  "Roboto Slab": "Roboto+Slab",
  "Merriweather": "Merriweather",
  "Lora": "Lora",
  "Playfair Display": "Playfair+Display",
};

const MONO_FONTS: Record<string, string> = {
  "Geist Mono": "Geist+Mono",
  "JetBrains Mono": "JetBrains+Mono",
};

// ─── Shadow presets ───
const SHADOW_PRESETS: Record<string, string> = {
  "None": "none",
  "Tailwind SM": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "Tailwind MD": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  "Tailwind LG": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  "Tailwind XL": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "Tailwind 2XL": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  "Soft Glow": "0px 10px 20px 0px rgba(0, 0, 0, 0.1)",
  "Subtle Depth": "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
  "Floating": "0px 15px 35px -5px rgba(0, 0, 0, 0.1)",
  "Soft Drop": "0px 4px 6px 0px rgba(0, 0, 0, 0.1)",
  "Layered": "0px 8px 16px -2px rgba(0, 0, 0, 0.1)",
  "Smoke": "0px 10px 50px -10px rgba(0, 0, 0, 0.1)",
  "Organic Soft": "5px 5px 15px -3px rgba(0, 0, 0, 0.15)",
  "Glassmorphism": "0px 4px 30px 0px rgba(31, 38, 135, 0.15)",
  "Dark Elegance": "0px 8px 24px -4px rgba(255, 255, 255, 0.1)",
  "Subtle Edge": "1px 1px 3px 0px rgba(0, 0, 0, 0.08)",
};

function loadGoogleFont(fontName: string, slug: string) {
  const id = `gf-${slug}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${slug}:wght@100..900&display=swap`;
  document.head.appendChild(link);
}

function useThemeTinker(colorTokens: ColorTokens) {
  const lightSchema = buildColorSchema(colorTokens.light, "light");
  const darkSchema = buildColorSchema(colorTokens.dark, "dark");
  const userEdited = useRef<Set<string>>(new Set());
  const prevValues = useRef<Record<string, unknown>>({});

  const [values] = useControls(() => ({
    "Typography": folder({
      "Body Font": {
        value: Object.keys(SANS_FONTS)[0],
        options: Object.keys(SANS_FONTS),
        onChange: (v: string) => {
          const slug = SANS_FONTS[v];
          if (slug) {
            loadGoogleFont(v, slug);
            document.documentElement.style.setProperty("--font-sans", `"${v}", sans-serif`);
          }
        },
      },
      "Heading Font": {
        value: Object.keys({ ...SANS_FONTS, ...SERIF_FONTS })[0],
        options: Object.keys({ ...SANS_FONTS, ...SERIF_FONTS }),
        onChange: (v: string) => {
          const slug = { ...SANS_FONTS, ...SERIF_FONTS }[v];
          if (slug) {
            loadGoogleFont(v, slug);
            document.documentElement.style.setProperty("--font-heading", `"${v}", serif`);
          }
        },
      },
      "Mono Font": {
        value: Object.keys(MONO_FONTS)[0],
        options: Object.keys(MONO_FONTS),
        onChange: (v: string) => {
          const slug = MONO_FONTS[v];
          if (slug) {
            loadGoogleFont(v, slug);
            document.documentElement.style.setProperty("--font-mono", `"${v}", monospace`);
          }
        },
      },
    }, { collapsed: true }),
    "Shadow": folder({
      "Box Shadow": {
        value: Object.keys(SHADOW_PRESETS)[0],
        options: Object.keys(SHADOW_PRESETS),
        onChange: (v: string) => {
          const shadow = SHADOW_PRESETS[v];
          if (shadow) {
            document.documentElement.style.setProperty("--shadow", shadow);
            // Also set common shadow scales
            document.querySelectorAll("[class*=shadow]").forEach((el) => {
              (el as HTMLElement).style.boxShadow = shadow === "none" ? "" : shadow;
            });
          }
        },
      },
    }, { collapsed: true }),
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
    "Light Mode": folder(lightSchema, { collapsed: true }),
    "Dark Mode": folder(darkSchema, { collapsed: true }),
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
