#!/usr/bin/env node
// Append the two portable CSS blocks the design-system viewer depends on to
// packages/ui/src/styles/globals.css:
//
//   1. A `@source inline(...)` safelist covering the full Tailwind color
//      palette so the viewer's tailwind-color grid actually renders (otherwise
//      Tailwind strips every bg-* class it can't find in source).
//
//   2. `.ds-color-picker` overrides that zero-out the padding/margin @uiw's
//      Sketch picker injects on its internal wrappers, so PopoverContent can
//      own the layout.
//
// Both blocks are idempotent — re-running is a no-op.
//
// Usage: node patch-ui-globals.mjs --root <monorepo-root>

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith("--")) {
      const k = arg.slice(2);
      const next = arr[i + 1];
      acc.push([k, next && !next.startsWith("--") ? next : true]);
    }
    return acc;
  }, [])
);

const root = args.root ? resolve(args.root) : process.cwd();
const cssPath = resolve(root, "packages/ui/src/styles/globals.css");

if (!existsSync(cssPath)) {
  console.error(`globals.css not found at ${cssPath}`);
  process.exit(1);
}

let css = readFileSync(cssPath, "utf-8");

const SAFELIST_MARKER = "@source inline(\"bg-{red,";
const PICKER_MARKER = ".ds-color-picker .w-color-sketch";

const SAFELIST_BLOCK = `
/* Safelist the full Tailwind color palette for the design-system preview grid */
@source inline("bg-{red,orange,amber,yellow,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose,slate,gray,zinc,neutral,stone}-{50,100,200,300,400,500,600,700,800,900,950}");
`;

const PICKER_BLOCK = `
/* @uiw/react-color-sketch injects inline padding/margin on its internal
   wrappers. Zero them out inside our color picker so the PopoverContent
   owns the spacing. */
.ds-color-picker .w-color-sketch > div:first-child { padding: 0 !important; }
.ds-color-picker .w-color-sketch > hr { margin: 0 !important; }
.ds-color-picker .w-color-sketch .w-color-swatch { padding: 8px 0 0 !important; }
.ds-color-picker .w-color-editable-input { padding: 8px 0 0 !important; }
`;

let changed = false;

// Insert the safelist after the last `@source "..."` line so it sits with the
// other @source directives shadcn's init already wrote.
if (!css.includes(SAFELIST_MARKER)) {
  const sourceLineRe = /(@source\s+["'][^"']+["'];\s*\n)(?!@source)/;
  const match = css.match(sourceLineRe);
  if (match) {
    css = css.replace(sourceLineRe, `$1${SAFELIST_BLOCK}`);
  } else {
    // No @source lines found — prepend to top of file.
    css = SAFELIST_BLOCK + "\n" + css;
  }
  changed = true;
}

// Append the picker overrides somewhere after the safelist — top of the
// file after the @source block is fine. Insert right after the safelist
// block we just added (or right after the last @source if safelist was
// already there).
if (!css.includes(PICKER_MARKER)) {
  if (css.includes(SAFELIST_MARKER)) {
    // Insert immediately after the safelist `;` line.
    const after = css.indexOf(SAFELIST_MARKER);
    const endOfLine = css.indexOf("\n", after + SAFELIST_MARKER.length);
    if (endOfLine > -1) {
      css = css.slice(0, endOfLine + 1) + PICKER_BLOCK + css.slice(endOfLine + 1);
    } else {
      css = css + "\n" + PICKER_BLOCK;
    }
  } else {
    css = css + "\n" + PICKER_BLOCK;
  }
  changed = true;
}

if (changed) {
  writeFileSync(cssPath, css);
  console.log(`patched ${cssPath} (safelist + .ds-color-picker CSS)`);
} else {
  console.log(`${cssPath} already patched`);
}
