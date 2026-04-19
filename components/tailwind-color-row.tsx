"use client";

import React, { useRef, useState } from "react";
import Color from "colorjs.io";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { ColorPickerContent } from "@/components/color-picker-content";
import { ScaleEditorDialog } from "@/components/scale-editor-dialog";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function computedHex(el: HTMLElement): string {
  try {
    const c = new Color(window.getComputedStyle(el).backgroundColor);
    return c.to("srgb").toString({ format: "hex" });
  } catch {
    return "#888888";
  }
}

function hexToOklch(hex: string): string {
  try {
    const oklch = new Color(hex).to("oklch");
    return `oklch(${oklch.coords[0]?.toFixed(4)} ${oklch.coords[1]?.toFixed(4)} ${oklch.coords[2]?.toFixed(2)})`;
  } catch {
    return hex;
  }
}

// ─── Header + Row ───

export function TailwindColorHeader() {
  return (
    <div className="flex items-center gap-4 pb-2">
      <div className="w-24 shrink-0" />
      <div className="grid flex-1 grid-cols-11 gap-px">
        {SHADES.map((shade) => (
          <div key={shade} className="text-center text-xs text-muted-foreground">
            {shade}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TailwindColorRow({ family }: { family: string }) {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="group/row flex items-center gap-4">
      <div className="flex w-24 shrink-0 items-center justify-between">
        <span className="text-sm font-medium capitalize text-foreground">
          {family}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditorOpen(true)}
          className="size-6 p-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
          aria-label={`Edit ${family} scale`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <div className="grid flex-1 grid-cols-11 gap-px">
        {SHADES.map((shade) => (
          <ColorSwatch key={shade} family={family} shade={shade} />
        ))}
      </div>
      <ScaleEditorDialog
        family={family}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}

function ColorSwatch({ family, shade }: { family: string; shade: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [initialHex, setInitialHex] = useState("#888888");
  const committedThisSession = useRef(false);

  const key = `${family}-${shade}`;
  const cssVar = `--color-${key}`;

  const restorePreview = () => {
    document.documentElement.style.setProperty(cssVar, initialHex);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          committedThisSession.current = false;
          if (ref.current) setInitialHex(computedHex(ref.current));
        } else if (!committedThisSession.current) {
          restorePreview();
        }
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          className={`relative h-10 cursor-pointer ring-2 ring-transparent transition-[box-shadow] hover:z-10 hover:ring-[#3E8AE2] bg-${family}-${shade}`}
          title={`bg-${family}-${shade}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
        <ColorPickerContent
          title={`${family.charAt(0).toUpperCase()}${family.slice(1)}-${shade}`}
          initialHex={initialHex}
          onPreview={(hex) => {
            document.documentElement.style.setProperty(cssVar, hex);
          }}
          onCommit={async (hex) => {
            try {
              const res = await fetch("/api/save-theme", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  light: {},
                  dark: {},
                  tailwindColors: { [`color-${key}`]: hexToOklch(hex) },
                }),
              });
              if (!res.ok) throw new Error(String(res.status));
              committedThisSession.current = true;
              document.documentElement.style.setProperty(cssVar, hex);
              toast.success(`Saved bg-${family}-${shade} to globals.css`);
              setOpen(false);
            } catch (err) {
              toast.error("Save failed: " + err);
            }
          }}
          onCancel={() => {
            restorePreview();
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
