import fs from "node:fs";
import path from "node:path";

export interface FontInfo {
  name: string;
  variable: string;
  label: string; // Body, Heading, Mono
  fontClass: string; // font-sans, font-serif, font-mono
  weights: string[];
}

export interface ColorTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface DesignSystemConfig {
  style: string;
  iconLibrary: string;
  fonts: FontInfo[];
  colorTokens: ColorTokens;
}

// Standard weight detection by font class
const WEIGHT_DEFAULTS: Record<string, string[]> = {
  "font-sans": ["Light", "Regular", "Medium", "Semibold", "Bold"],
  "font-serif": ["Regular", "Medium", "Bold"],
  "font-mono": ["Regular", "Medium", "Bold"],
};

const LABEL_MAP: Record<string, string> = {
  "--font-sans": "Body",
  "--font-heading": "Heading",
  "--font-mono": "Mono",
};

const CLASS_MAP: Record<string, string> = {
  "--font-sans": "font-sans",
  "--font-heading": "font-serif",
  "--font-mono": "font-mono",
};

export function getDesignSystemConfig(): DesignSystemConfig {
  // Read components.json
  const uiConfigPath = path.resolve(process.cwd(), "../../packages/ui/components.json");
  const uiConfig = JSON.parse(fs.readFileSync(uiConfigPath, "utf-8"));

  // Read web layout.tsx to extract fonts
  const layoutPath = path.resolve(process.cwd(), "../web/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  const fonts = parseFontsFromLayout(layoutContent);

  // Read globals.css to extract color tokens for both modes
  const cssPath = path.resolve(process.cwd(), "../../packages/ui/src/styles/globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  const colorTokens = parseColorTokens(cssContent);

  return {
    style: uiConfig.style ?? "radix-nova",
    iconLibrary: uiConfig.iconLibrary ?? "lucide",
    fonts,
    colorTokens,
  };
}

function parseColorTokens(css: string): ColorTokens {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  // Match :root { ... } block
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    parseVarsFromBlock(rootMatch[1], light);
  }

  // Match .dark { ... } block
  const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch) {
    parseVarsFromBlock(darkMatch[1], dark);
  }

  return { light, dark };
}

function parseVarsFromBlock(block: string, target: Record<string, string>) {
  const varRe = /--([\w-]+)\s*:\s*([^;]+);/g;
  for (const match of block.matchAll(varRe)) {
    const name = match[1];
    const value = match[2].trim();
    target[name] = value;
  }
}

function parseFontsFromLayout(source: string): FontInfo[] {
  const fonts: FontInfo[] = [];

  // Extract import names from next/font/google
  // e.g., import { Geist, Geist_Mono, DM_Sans, Noto_Serif } from "next/font/google"
  const importRe = /import\s*\{([^}]+)\}\s*from\s*["']next\/font\/(?:google|local)["']/;
  const importMatch = source.match(importRe);
  const importedFonts = new Map<string, string>();

  if (importMatch) {
    const names = importMatch[1].split(",").map((n) => n.trim());
    for (const name of names) {
      // DM_Sans → "DM Sans", Geist_Mono → "Geist Mono"
      const readable = name.replace(/_/g, " ");
      importedFonts.set(name, readable);
    }
  }

  // Find font constructor calls with variable assignments
  // e.g., const fontSans = DM_Sans({subsets:['latin'],variable:'--font-sans'})
  const callRe = /(\w+)\s*\(\s*\{[^}]*variable\s*:\s*['"](--.+?)['"]/g;
  for (const match of source.matchAll(callRe)) {
    const constructorName = match[1];
    const variable = match[2];

    const name = importedFonts.get(constructorName) ?? constructorName.replace(/_/g, " ");
    const label = LABEL_MAP[variable] ?? variable.replace("--font-", "");
    const fontClass = CLASS_MAP[variable] ?? "font-sans";
    const weights = WEIGHT_DEFAULTS[fontClass] ?? ["Regular", "Bold"];

    fonts.push({ name, variable, label, fontClass, weights });
  }

  // Sort: Body first, Heading second, Mono third
  const order = ["Body", "Heading", "Mono"];
  fonts.sort((a, b) => {
    const ai = order.indexOf(a.label);
    const bi = order.indexOf(b.label);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return fonts;
}
