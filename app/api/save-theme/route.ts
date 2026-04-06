import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

interface SaveThemeRequest {
  light: Record<string, string>;
  dark: Record<string, string>;
  radius?: string;
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

    fs.writeFileSync(cssPath, css);

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
