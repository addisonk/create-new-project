"use client";

import React from "react";
import Color from "colorjs.io";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
type Shade = (typeof SHADES)[number];

// Target oklch lightness per shade, tuned from Tailwind's own `red-*` palette.
const LIGHTNESS_CURVE: Record<Shade, number> = {
  50: 0.971,
  100: 0.936,
  200: 0.885,
  300: 0.808,
  400: 0.704,
  500: 0.637,
  600: 0.577,
  700: 0.505,
  800: 0.444,
  900: 0.396,
  950: 0.258,
};

// Chroma multiplier per shade, also derived from Tailwind's red-* ratios.
// Peaks just past 500 (600 often carries the richest brand color) and
// decays steeply at both ends where the sRGB gamut collapses anyway.
const CHROMA_CURVE: Record<Shade, number> = {
  50: 0.055,
  100: 0.135,
  200: 0.26,
  300: 0.48,
  400: 0.80,
  500: 1.0,
  600: 1.03,
  700: 0.90,
  800: 0.75,
  900: 0.60,
  950: 0.39,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHue(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

function isValidHex(v: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(v.trim());
}

function normalizeHex(v: string): string {
  const stripped = v.trim().replace(/^#/, "");
  return "#" + stripped;
}

function hexToOklchString(hex: string): string {
  const c = new Color(hex).to("oklch");
  const [l, ch, h] = c.coords;
  return `oklch(${(l ?? 0).toFixed(4)} ${(ch ?? 0).toFixed(4)} ${(h ?? 0).toFixed(2)})`;
}

function srgbCoordsToHex(r: number, g: number, b: number): string {
  const toByte = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n ?? 0)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`.toUpperCase();
}

function oklchCoordsToHex(l: number, c: number, h: number): string {
  // Gamut-map into sRGB before clipping so we don't silently flatten to white
  // when oklch L/C is out of range (which happens at the light/dark extremes).
  const srgb = new Color("oklch", [l, c, h])
    .to("srgb")
    .toGamut({ space: "srgb", method: "css" });
  const [r, g, b] = srgb.coords;
  return srgbCoordsToHex(r ?? 0, g ?? 0, b ?? 0);
}

function anyColorToHex(raw: string): string {
  try {
    const srgb = new Color(raw.trim()).to("srgb").toGamut({ space: "srgb", method: "css" });
    const [r, g, b] = srgb.coords;
    return srgbCoordsToHex(r ?? 0, g ?? 0, b ?? 0);
  } catch {
    return "";
  }
}

function readCurrentPalette(family: string): Record<Shade, string> {
  const empty = SHADES.reduce((acc, s) => ({ ...acc, [s]: "" }), {} as Record<Shade, string>);
  if (typeof window === "undefined") return empty;
  const styles = getComputedStyle(document.documentElement);
  const result = { ...empty };
  for (const shade of SHADES) {
    const raw = styles.getPropertyValue(`--color-${family}-${shade}`).trim();
    if (!raw) continue;
    const hex = anyColorToHex(raw);
    if (hex) result[shade] = hex;
  }
  return result;
}

/**
 * Fill empty shades using the provided waypoints.
 *
 * - 1 input: sweep lightness/chroma curves anchored at that color.
 * - 2+ inputs: linearly interpolate oklch between adjacent waypoints;
 *   extrapolate edges by stepping the fixed curves outward from the nearest
 *   waypoint.
 */
function fillShades(provided: Record<Shade, string>): Record<Shade, string> {
  const waypoints = SHADES
    .filter((s) => provided[s] && isValidHex(provided[s]))
    .map((s) => {
      const oklch = new Color(normalizeHex(provided[s])).to("oklch");
      return {
        shade: s,
        l: oklch.coords[0] ?? 0,
        c: oklch.coords[1] ?? 0,
        h: oklch.coords[2] ?? 0,
      };
    })
    .sort((a, b) => a.shade - b.shade);

  const result = { ...provided };
  if (waypoints.length === 0) return result;

  if (waypoints.length === 1) {
    const w = waypoints[0]!;
    for (const shade of SHADES) {
      if (provided[shade]) continue;
      const l = LIGHTNESS_CURVE[shade];
      const c = Math.max(0, w.c * CHROMA_CURVE[shade]);
      result[shade] = oklchCoordsToHex(l, c, w.h);
    }
    return result;
  }

  for (const shade of SHADES) {
    if (provided[shade]) continue;

    const lower = [...waypoints].reverse().find((w) => w.shade < shade);
    const upper = waypoints.find((w) => w.shade > shade);

    let l: number;
    let c: number;
    let h: number;

    if (lower && upper) {
      const t = (shade - lower.shade) / (upper.shade - lower.shade);
      l = lerp(lower.l, upper.l, t);
      c = lerp(lower.c, upper.c, t);
      h = lerpHue(lower.h, upper.h, t);
    } else if (lower) {
      const dl = LIGHTNESS_CURVE[shade] - LIGHTNESS_CURVE[lower.shade as Shade];
      const cRatio = CHROMA_CURVE[shade] / CHROMA_CURVE[lower.shade as Shade];
      l = Math.max(0, Math.min(1, lower.l + dl));
      c = Math.max(0, lower.c * cRatio);
      h = lower.h;
    } else if (upper) {
      const dl = LIGHTNESS_CURVE[shade] - LIGHTNESS_CURVE[upper.shade as Shade];
      const cRatio = CHROMA_CURVE[shade] / CHROMA_CURVE[upper.shade as Shade];
      l = Math.max(0, Math.min(1, upper.l + dl));
      c = Math.max(0, upper.c * cRatio);
      h = upper.h;
    } else {
      continue;
    }

    result[shade] = oklchCoordsToHex(l, c, h);
  }

  return result;
}

export function ScaleEditorDialog({
  family,
  open,
  onOpenChange,
  onSaved,
}: {
  family: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [values, setValues] = React.useState<Record<Shade, string>>(() =>
    SHADES.reduce((acc, s) => ({ ...acc, [s]: "" }), {} as Record<Shade, string>),
  );
  const [saving, setSaving] = React.useState(false);

  // Pre-fill with the current palette when the dialog opens so the user sees
  // what's already there. They can Clear to start fresh or edit specific shades.
  React.useEffect(() => {
    if (open) {
      setValues(readCurrentPalette(family));
    }
  }, [open, family]);

  const filledCount = SHADES.filter((s) => isValidHex(values[s])).length;
  const allFilled = filledCount === SHADES.length;
  const canFill = filledCount > 0 && filledCount < SHADES.length;

  const handleFill = () => {
    setValues((prev) => fillShades(prev));
  };

  const handleClearAll = () => {
    setValues(SHADES.reduce((acc, s) => ({ ...acc, [s]: "" }), {} as Record<Shade, string>));
  };

  const handleRestoreDefaults = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const deleteTailwindColors = SHADES.map((s) => `color-${family}-${s}`);
      const res = await fetch("/api/save-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ light: {}, dark: {}, deleteTailwindColors }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Clear live inline overrides so Tailwind's defaults show immediately.
      for (const shade of SHADES) {
        document.documentElement.style.removeProperty(`--color-${family}-${shade}`);
      }
      // Re-read the now-default palette into the form.
      setValues(readCurrentPalette(family));
      toast.success(`Restored Tailwind ${family} defaults`);
    } catch (err) {
      toast.error("Restore failed: " + err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!allFilled || saving) return;
    setSaving(true);
    try {
      const tailwindColors: Record<string, string> = {};
      for (const shade of SHADES) {
        tailwindColors[`color-${family}-${shade}`] = hexToOklchString(normalizeHex(values[shade]));
      }
      const res = await fetch("/api/save-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ light: {}, dark: {}, tailwindColors }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Apply overrides live so the row updates instantly.
      for (const shade of SHADES) {
        document.documentElement.style.setProperty(
          `--color-${family}-${shade}`,
          normalizeHex(values[shade]),
        );
      }
      toast.success(`Saved ${family} scale to globals.css`);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("Save failed: " + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Generate {family} scale</DialogTitle>
          <DialogDescription>
            Enter one or more brand hex values, then fill the empty shades. The algorithm
            interpolates in oklch space using your inputs as waypoints.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          {SHADES.map((shade) => {
            const val = values[shade];
            const valid = isValidHex(val);
            return (
              <div key={shade} className="flex items-center gap-3">
                <div
                  className="size-8 shrink-0 rounded border border-border"
                  style={{ backgroundColor: valid ? normalizeHex(val) : "transparent" }}
                />
                <span className="w-10 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                  {shade}
                </span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    #
                  </span>
                  <input
                    value={val.replace(/^#/, "").toUpperCase()}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [shade]: e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6),
                      }))
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="h-9 w-full rounded-md border border-border bg-background pl-7 pr-8 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {val && (
                    <button
                      type="button"
                      onClick={() =>
                        setValues((prev) => ({ ...prev, [shade]: "" }))
                      }
                      className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Clear ${shade}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRestoreDefaults}
              disabled={saving}
            >
              Restore defaults
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={filledCount === 0}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={handleFill}
              disabled={!canFill}
            >
              Fill empty shades
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!allFilled || saving}>
            {saving ? "Saving..." : "Save scale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
