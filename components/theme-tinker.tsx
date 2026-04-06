"use client";

import React, { useEffect, useRef, useCallback, createContext, useContext } from "react";
import { useControls, folder, Leva } from "leva";
import Color from "colorjs.io";
import { toast } from "sonner";
import type { ColorTokens } from "@/lib/config";

type LevaColor = string | { r: number; g: number; b: number; a: number };

export interface ThemeEditor {
  values: Record<string, unknown>;
  userEdited: React.MutableRefObject<Set<string>>;
  set: (values: Record<string, unknown>) => void;
  changeCount: number;
  save: () => Promise<void>;
  revert: () => void;
}

const ThemeEditorContext = createContext<{ editor: ThemeEditor; tinkerOpen: boolean; setTinkerOpen: (open: boolean) => void } | null>(null);
export const ThemeEditorProvider = ThemeEditorContext.Provider;
export function useThemeEditor() {
  return useContext(ThemeEditorContext);
}

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
  "Instrument Serif": "Instrument+Serif",
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
  "Neon Dream": "0px 0px 20px 5px rgba(66, 220, 219, 0.5)",
  "Neumorphic": "20px 20px 60px -15px rgba(255, 255, 255, 0.5)",
  "Vivid Pop": "4px 4px 0px 0px rgba(255, 105, 180, 0.8)",
  "Cosmic Glow": "0px 0px 40px 0px rgba(138, 43, 226, 0.4)",
  "Neon Outline": "0px 0px 10px 2px rgba(0, 255, 255, 0.7)",
  "Retro Pixel": "5px 5px 0px 0px rgba(0, 0, 0, 0.5)",
  "Dreamy Pastel": "0px 10px 30px 0px rgba(255, 182, 193, 0.3)",
  "Cyberpunk Edge": "-5px 5px 0px 0px rgba(255, 0, 0, 0.8)",
  "Minimalist": "2px 2px 0px 0px rgba(0, 0, 0, 0.1)",
  "Frosted Glass": "0px 4px 20px 0px rgba(255, 255, 255, 0.2)",
  "Polaroid": "0px 8px 0px 0px rgba(0, 0, 0, 0.2)",
  "Harsh Side": "8px 0px 4px -2px rgba(0, 0, 0, 0.25)",
};

// Fonts that are NOT variable — only support specific weights
const STATIC_FONTS = new Set(["Instrument+Serif", "Merriweather"]);

function loadGoogleFont(fontName: string, slug: string) {
  const id = `gf-${slug}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  if (STATIC_FONTS.has(slug)) {
    link.href = `https://fonts.googleapis.com/css2?family=${slug}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
  } else {
    link.href = `https://fonts.googleapis.com/css2?family=${slug}:wght@100..900&display=swap`;
  }
  document.head.appendChild(link);
}

export function useThemeTinker(colorTokens: ColorTokens) {
  const lightSchema = buildColorSchema(colorTokens.light, "light");
  const darkSchema = buildColorSchema(colorTokens.dark, "dark");
  const userEdited = useRef<Set<string>>(new Set());
  const prevValues = useRef<Record<string, unknown>>({});
  const [changeCount, setChangeCount] = React.useState(0);

  const [values, set] = useControls(() => ({
    "Typography": folder({
      "Body Font": {
        value: Object.keys(SANS_FONTS)[0],
        options: Object.keys({ ...SANS_FONTS, ...SERIF_FONTS }),
        onChange: (v: string) => {
          const allFonts = { ...SANS_FONTS, ...SERIF_FONTS };
          const slug = allFonts[v];
          if (slug) {
            loadGoogleFont(v, slug);
            const fallback = v in SERIF_FONTS ? "serif" : "sans-serif";
            document.documentElement.style.setProperty("--font-sans", `"${v}", ${fallback}`);
          }
        },
      },
      "Heading Font": {
        value: "Inherit",
        options: ["Inherit", ...Object.keys({ ...SERIF_FONTS, ...SANS_FONTS })],
        onChange: (v: string) => {
          // Remove heading style tag if it exists
          const existingStyle = document.getElementById("dsv-heading-font");
          if (existingStyle) existingStyle.remove();

          if (v === "Inherit") {
            document.documentElement.style.removeProperty("--font-heading");
            document.documentElement.style.removeProperty("--font-serif");
            return;
          }
          const allFonts = { ...SERIF_FONTS, ...SANS_FONTS };
          const slug = allFonts[v];
          if (slug) {
            loadGoogleFont(v, slug);
            const fallback = v in SERIF_FONTS ? "serif" : "sans-serif";
            const fontValue = `"${v}", ${fallback}`;
            document.documentElement.style.setProperty("--font-heading", fontValue);
            document.documentElement.style.setProperty("--font-serif", fontValue);

            // Inject a style tag to force headings + font-serif to use the heading font
            const style = document.createElement("style");
            style.id = "dsv-heading-font";
            style.textContent = `
              .font-serif, .font-heading,
              h1, h2, h3, h4, h5, h6,
              [class*="cn-font-heading"] {
                font-family: ${fontValue} !important;
              }
            `;
            document.head.appendChild(style);
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
        value: "Tailwind SM",
        options: Object.keys(SHADOW_PRESETS),
        onChange: (v: string) => {
          const shadow = SHADOW_PRESETS[v];
          if (!shadow) return;

          // Remove previous shadow style tag
          const existing = document.getElementById("dsv-shadow");
          if (existing) existing.remove();

          if (shadow === "none") {
            const style = document.createElement("style");
            style.id = "dsv-shadow";
            style.textContent = `
              [class*="shadow"] { box-shadow: none !important; }
            `;
            document.head.appendChild(style);
          } else {
            const style = document.createElement("style");
            style.id = "dsv-shadow";
            style.textContent = `
              .shadow-sm, .shadow, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl,
              [class*="cn-card"] {
                box-shadow: ${shadow} !important;
              }
            `;
            document.head.appendChild(style);
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

  // Ref for values so applyOverrides stays stable
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // Apply overrides for the current mode only (stable — reads values via ref)
  const applyOverrides = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const currentValues = valuesRef.current;

    // Clear ALL color overrides first
    for (const key of COLOR_KEYS) {
      document.documentElement.style.removeProperty(`--${key}`);
    }

    // Re-apply only user-edited values matching current mode
    for (const editedKey of userEdited.current) {
      const cssKey = editedKey.startsWith("dk:") ? editedKey.slice(3) : editedKey;
      const isForDark = editedKey.startsWith("dk:");

      if ((isDark && isForDark) || (!isDark && !isForDark)) {
        const val = currentValues[editedKey];
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
  }, []);

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
    setChangeCount(userEdited.current.size);
    applyOverrides();
  }, [values, applyOverrides]);

  // Clear and re-apply when dark mode toggles
  useEffect(() => {
    const observer = new MutationObserver(() => applyOverrides());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [applyOverrides]);

  // Save changes to globals.css
  const save = useCallback(async () => {
    if (userEdited.current.size === 0) return;
    try {
      const result = await saveTheme(valuesRef.current, userEdited.current, colorTokens);
      if (result.success) {
        toast.success("Theme saved to globals.css");
        userEdited.current.clear();
        setChangeCount(0);
      } else {
        toast.error("Save failed: " + result.error);
      }
    } catch (err) {
      toast.error("Save failed: " + err);
    }
  }, [colorTokens]);

  // Revert all changes
  const revert = useCallback(() => {
    // Clear all inline CSS overrides
    for (const key of COLOR_KEYS) {
      document.documentElement.style.removeProperty(`--${key}`);
    }
    // Reset Leva values to originals
    const resets: Record<string, LevaColor> = {};
    for (const editedKey of userEdited.current) {
      if (editedKey === "Radius") continue;
      const isForDark = editedKey.startsWith("dk:");
      const cssKey = isForDark ? editedKey.slice(3) : editedKey;
      const tokens = isForDark ? colorTokens.dark : colorTokens.light;
      if (tokens[cssKey]) {
        resets[editedKey] = oklchToLeva(tokens[cssKey]);
      }
    }
    if (Object.keys(resets).length > 0) set(resets);
    userEdited.current.clear();
    setChangeCount(0);
  }, [colorTokens, set]);

  return { values, userEdited, set, changeCount, save, revert };
}

function levaColorToOklch(val: LevaColor): string {
  try {
    if (typeof val === "object" && "r" in val) {
      const { r, g, b, a } = val;
      const c = new Color("srgb", [r / 255, g / 255, b / 255], a);
      const oklch = c.to("oklch");
      const alpha = a != null && a < 1 ? ` / ${Math.round(a * 100)}%` : "";
      return `oklch(${oklch.coords[0]?.toFixed(3)} ${oklch.coords[1]?.toFixed(3)} ${oklch.coords[2]?.toFixed(1)}${alpha})`;
    } else if (typeof val === "string") {
      const c = new Color(val);
      const oklch = c.to("oklch");
      return `oklch(${oklch.coords[0]?.toFixed(3)} ${oklch.coords[1]?.toFixed(3)} ${oklch.coords[2]?.toFixed(1)})`;
    }
  } catch {}
  return String(val);
}

async function saveTheme(
  values: Record<string, unknown>,
  userEdited: Set<string>,
  colorTokens: ColorTokens
) {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  let radius: string | undefined;

  for (const key of userEdited) {
    const val = values[key];
    if (!val) continue;

    if (key === "Radius") {
      radius = `${val}rem`;
      continue;
    }

    const isForDark = key.startsWith("dk:");
    const cssKey = isForDark ? key.slice(3) : key;
    const oklch = levaColorToOklch(val as LevaColor);

    if (isForDark) {
      dark[cssKey] = oklch;
    } else {
      light[cssKey] = oklch;
    }
  }

  const res = await fetch("/api/save-theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ light, dark, radius }),
  });

  return res.json();
}

export function ThemeTinker({
  enabled,
}: {
  enabled: boolean;
  colorTokens: ColorTokens;
  editor: ThemeEditor;
}) {
  return <Leva hidden={!enabled} collapsed={false} />;
}
