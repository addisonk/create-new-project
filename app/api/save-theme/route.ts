import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

interface SaveThemeRequest {
  light: Record<string, string>;
  dark: Record<string, string>;
  radius?: string;
  // Tailwind color scale overrides — keys like "color-red-500" written to :root
  tailwindColors?: Record<string, string>;
  // Keys like "color-red-500" to delete from :root so Tailwind's default wins
  deleteTailwindColors?: string[];
}

export async function POST(request: Request) {
  try {
    const body: SaveThemeRequest = await request.json();

    const cssPath = path.resolve(
      process.cwd(),
      "../../packages/ui/src/styles/globals.css"
    );

    if (!fs.existsSync(cssPath)) {
      return NextResponse.json(
        { error: "globals.css not found" },
        { status: 404 }
      );
    }

    let css = fs.readFileSync(cssPath, "utf-8");

    // Update :root block
    if (body.light && Object.keys(body.light).length > 0) {
      css = updateCSSBlock(css, ":root", body.light);
    }

    // Update .dark block
    if (body.dark && Object.keys(body.dark).length > 0) {
      css = updateCSSBlock(css, ".dark", body.dark);
    }

    // Update radius in :root
    if (body.radius) {
      css = updateCSSVar(css, ":root", "--radius", body.radius);
    }

    // Tailwind color scale overrides live in :root
    if (body.tailwindColors && Object.keys(body.tailwindColors).length > 0) {
      css = updateCSSBlock(css, ":root", body.tailwindColors);
    }

    // Delete specified Tailwind color overrides from :root.
    if (body.deleteTailwindColors && body.deleteTailwindColors.length > 0) {
      css = deleteCSSVars(css, ":root", body.deleteTailwindColors);
    }

    // Atomic write + explicit mtime bump. Turbopack's dev-time file watcher
    // sometimes misses `fs.writeFileSync` calls that originate from inside
    // the same Node process it's running (the watcher de-dupes self-triggered
    // events). That leaves the compiled CSS chunk stale, and the UI shows
    // the pre-edit palette even though the file on disk is correct.
    //
    // Writing to a .tmp file and renameSync into place produces a CREATE +
    // RENAME pair that looks identical to an external editor save — watchers
    // reliably fire on the rename. The utimesSync is a belt-and-suspenders
    // nudge in case chokidar is comparing mtimes.
    const tmpPath = `${cssPath}.tmp`;
    fs.writeFileSync(tmpPath, css);
    fs.renameSync(tmpPath, cssPath);
    fs.utimesSync(cssPath, new Date(), new Date());

    return NextResponse.json({ success: true, path: cssPath });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

function updateCSSBlock(
  css: string,
  selector: string,
  tokens: Record<string, string>
): string {
  // Find the block: :root { ... } or .dark { ... }
  const escapedSelector = selector.replace(".", "\\.");
  const blockRe = new RegExp(
    `(${escapedSelector}\\s*\\{)([^}]+)(\\})`,
    "s"
  );
  const match = css.match(blockRe);
  if (!match) return css;

  let block = match[2];

  for (const [name, value] of Object.entries(tokens)) {
    const varName = name.startsWith("--") ? name : `--${name}`;
    // Replace existing variable or append
    const varRe = new RegExp(`(${varName.replace("-", "\\-")}\\s*:)\\s*[^;]+;`);
    if (varRe.test(block)) {
      block = block.replace(varRe, `$1 ${value};`);
    } else {
      // Append before closing brace
      block = block.trimEnd() + `\n    ${varName}: ${value};\n`;
    }
  }

  return css.replace(blockRe, `${match[1]}${block}${match[3]}`);
}

function updateCSSVar(
  css: string,
  selector: string,
  varName: string,
  value: string
): string {
  return updateCSSBlock(css, selector, { [varName]: value });
}

function deleteCSSVars(
  css: string,
  selector: string,
  varNames: string[]
): string {
  const escapedSelector = selector.replace(".", "\\.");
  const blockRe = new RegExp(
    `(${escapedSelector}\\s*\\{)([^}]+)(\\})`,
    "s"
  );
  const match = css.match(blockRe);
  if (!match) return css;

  let block = match[2];
  for (const name of varNames) {
    const varName = name.startsWith("--") ? name : `--${name}`;
    // Match whole line: optional leading whitespace, the var, a value, and the trailing newline.
    const lineRe = new RegExp(
      `\\n?\\s*${varName.replace(/-/g, "\\-")}\\s*:[^;]+;`,
      "g"
    );
    block = block.replace(lineRe, "");
  }

  return css.replace(blockRe, `${match[1]}${block}${match[3]}`);
}
