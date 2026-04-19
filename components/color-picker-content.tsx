"use client";

import React from "react";
import Sketch from "@uiw/react-color-sketch";
import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/**
 * Figma-style picker: header with title + close, Sketch body, Cancel / Save footer.
 * Alpha is enabled — the caller receives hex (RGB) or hexa (RGBA) depending on
 * whether the picked color has transparency.
 */
export function ColorPickerContent({
  title,
  initialHex,
  onPreview,
  onCommit,
  onCancel,
  presetColors,
}: {
  title: string;
  initialHex: string;
  onPreview: (hex: string) => void;
  onCommit: (hex: string) => void;
  onCancel: () => void;
  presetColors?: string[];
}) {
  const [color, setColor] = React.useState(initialHex);

  React.useEffect(() => {
    setColor(initialHex);
  }, [initialHex]);

  return (
    <div className="ds-color-picker flex w-[240px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Picker */}
      <div className="p-3">
        <Sketch
          style={{
            boxShadow: "none",
            background: "transparent",
            width: "100%",
            padding: 0,
          }}
          color={color}
          presetColors={presetColors}
          onChange={(c) => {
            // hexa includes alpha when < 1; hex is RGB only.
            const next = c.hsva.a < 1 ? c.hexa : c.hex;
            setColor(next);
            onPreview(next);
          }}
        />
      </div>

      {/* Cancel / Save */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="flex-1" onClick={() => onCommit(color)}>
          Save
        </Button>
      </div>
    </div>
  );
}
