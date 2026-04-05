"use client";

import { useControls, folder, button, Leva } from "leva";
import Color from "colorjs.io";
import { useEffect, useRef } from "react";

// Convert any CSS color (oklch, lab, etc.) to hex for Leva's color picker
function cssToHex(cssValue: string): string {
  try {
    const c = new Color(cssValue);
    return c.to("srgb").toString({ format: "hex" });
  } catch {
    return "#000000";
  }
}

// Convert hex back to oklch for CSS variable
function hexToOklch(hex: string): string {
  try {
    const c = new Color(hex);
    const oklch = c.to("oklch");
    const l = oklch.coords[0]?.toFixed(3) ?? "0";
    const ch = oklch.coords[1]?.toFixed(3) ?? "0";
    const h = oklch.coords[2]?.toFixed(1) ?? "0";
    return `oklch(${l} ${ch} ${h})`;
  } catch {
    return hex;
  }
}

function readCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setCSSVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

const COLOR_VARS = [
  { var: "--background", label: "Background" },
  { var: "--foreground", label: "Foreground" },
  { var: "--primary", label: "Primary" },
  { var: "--primary-foreground", label: "Primary FG" },
  { var: "--secondary", label: "Secondary" },
  { var: "--secondary-foreground", label: "Secondary FG" },
  { var: "--accent", label: "Accent" },
  { var: "--muted", label: "Muted" },
  { var: "--destructive", label: "Destructive" },
  { var: "--border", label: "Border" },
  { var: "--ring", label: "Ring" },
  { var: "--chart-1", label: "Chart 1" },
  { var: "--chart-2", label: "Chart 2" },
  { var: "--chart-3", label: "Chart 3" },
];

export function ThemeTinker({ enabled }: { enabled: boolean }) {
  const originals = useRef<Record<string, string>>({});

  // Capture original values on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const orig: Record<string, string> = {};
    COLOR_VARS.forEach(({ var: v }) => {
      orig[v] = readCSSVar(v);
    });
    orig["--radius"] = readCSSVar("--radius");
    originals.current = orig;
  }, []);

  // Build color controls
  const colorControls: Record<string, unknown> = {};
  COLOR_VARS.forEach(({ var: v, label }) => {
    colorControls[label] = {
      value: typeof window !== "undefined" ? cssToHex(readCSSVar(v)) : "#000000",
      onChange: (hex: string) => {
        setCSSVar(v, hexToOklch(hex));
      },
    };
  });

  useControls(
    {
      Colors: folder(colorControls),
      Radius: {
        value: typeof window !== "undefined" ? parseFloat(readCSSVar("--radius")) || 0.625 : 0.625,
        min: 0,
        max: 2,
        step: 0.025,
        onChange: (v: number) => setCSSVar("--radius", `${v}rem`),
      },
      " ": button(() => {
        // Reset all to originals
        Object.entries(originals.current).forEach(([k, v]) => {
          document.documentElement.style.removeProperty(k);
        });
      }, { label: "Reset to Default" } as never),
    },
    { collapsed: false }
  );

  return <Leva hidden={!enabled} collapsed={false} />;
}
