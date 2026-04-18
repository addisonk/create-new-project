#!/usr/bin/env node
// Post-clone fixups for apps/design-system:
//   1. Sync components.json "style" from packages/ui/components.json.
//   2. Sync fonts from apps/web/app/layout.tsx into apps/design-system/app/layout.tsx
//      (replaces only the font imports + the font variable declarations +
//       the className call, preserves ThemeProvider/TooltipProvider/Toaster).
//   3. Add a 2s startup delay to design-system's dev script so web grabs the
//      lowest free port first (deterministic order under turbo parallel dev).
//
// Usage: node patch-design-system.mjs --root <monorepo-root>

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
const webLayout = resolve(root, "apps/web/app/layout.tsx");
const dsLayout = resolve(root, "apps/design-system/app/layout.tsx");
const dsComponentsJson = resolve(root, "apps/design-system/components.json");
const uiComponentsJson = resolve(root, "packages/ui/components.json");
const dsPkgJson = resolve(root, "apps/design-system/package.json");

// --- 1. Sync components.json style ------------------------------------------
if (existsSync(uiComponentsJson) && existsSync(dsComponentsJson)) {
  const uiJson = JSON.parse(readFileSync(uiComponentsJson, "utf-8"));
  const dsJson = JSON.parse(readFileSync(dsComponentsJson, "utf-8"));
  if (uiJson.style && dsJson.style !== uiJson.style) {
    dsJson.style = uiJson.style;
    writeFileSync(dsComponentsJson, JSON.stringify(dsJson, null, 2) + "\n");
    console.log(`synced design-system style → ${uiJson.style}`);
  }
}

// --- 2. Sync fonts from web ------------------------------------------------
// Extract the next/font/google import line + font variable declarations from
// web's layout.tsx, then splice them into design-system's layout.tsx,
// replacing whatever font setup was there.
if (existsSync(webLayout) && existsSync(dsLayout)) {
  const webSrc = readFileSync(webLayout, "utf-8");
  let dsSrc = readFileSync(dsLayout, "utf-8");

  const fontImportRe = /import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["'];?/;
  const webFontImport = webSrc.match(fontImportRe);

  // Match const X = FontName({...}); — may span multiple lines.
  const fontDeclRe = /const\s+\w+\s*=\s*\w+\(\{[^}]*\}\);?/g;
  const webFontDecls = webSrc.match(fontDeclRe) || [];

  // Find the className={cn(...)} call on the <html> element in web and grab
  // its argument list so we can reuse the same className in design-system.
  const classNameRe = /className=\{cn\(([^)]+)\)\}/;
  const webClassName = webSrc.match(classNameRe);

  if (webFontImport && webFontDecls.length && webClassName) {
    // Replace design-system's font import + declarations + className args.
    dsSrc = dsSrc.replace(fontImportRe, webFontImport[0]);

    // Replace the block of const font = Font({...}); declarations.
    // Strategy: drop all existing font decls, then insert the new block
    // immediately after the imports.
    dsSrc = dsSrc.replace(fontDeclRe, "");

    // Insert font declarations after the last import line.
    const lastImportRe = /(import[^;]+;)(?![\s\S]*import[^;]+;)/;
    const lastImportMatch = dsSrc.match(lastImportRe);
    if (lastImportMatch) {
      const insertion = "\n\n" + webFontDecls.join("\n");
      dsSrc = dsSrc.replace(lastImportRe, `$1${insertion}`);
    }

    // Sync className arg list.
    dsSrc = dsSrc.replace(classNameRe, `className={cn(${webClassName[1]})}`);

    writeFileSync(dsLayout, dsSrc);
    console.log(`synced design-system fonts from web`);
  } else {
    console.warn("could not extract font setup from web/layout.tsx — skipping font sync");
  }
}

// --- 3. Add sleep 2 to design-system dev script ----------------------------
if (existsSync(dsPkgJson)) {
  const pkg = JSON.parse(readFileSync(dsPkgJson, "utf-8"));
  pkg.scripts = pkg.scripts || {};
  const cur = pkg.scripts.dev || "next dev --turbopack";
  if (!cur.startsWith("sleep")) {
    pkg.scripts.dev = `sleep 2 && ${cur}`;
    writeFileSync(dsPkgJson, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`patched design-system dev script (added sleep 2)`);
  }
}
