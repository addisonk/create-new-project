# Create New Project

Scaffold a new shadcn/ui monorepo project with all components and a design system viewer.

## When to Use

Use when the user wants to start a new project, create a new app, or scaffold a fresh monorepo with shadcn/ui.

## Interaction Method

**IMPORTANT:** Always use the `AskUserQuestion` tool for gathering input from the user. Do NOT print questions as plain text — use the tool so the user gets a proper interactive prompt in the TUI. Ask one question at a time.

## Steps

1. If project name was NOT provided as an argument, use `AskUserQuestion` to ask:
   - Question: "What should the project be called?"

2. Use `AskUserQuestion` to ask about a preset:
   - Question: "Do you want to use a shadcn preset? Enter a preset ID or URL, or press enter to use the default (b2D0wqNxT — Radix Luma)."
   - If they provide a full URL like `https://ui.shadcn.com/create?preset=b2D0wqNxT`, extract just the preset ID (`b2D0wqNxT`)
   - If they press enter / say no / say skip / say default, use `b2D0wqNxT` as the preset
   - The default preset `b2D0wqNxT` uses Radix UI with Luma style

3. Determine where to create the project:
   - Check if `~/Projects/` exists
   - If it does, use `~/Projects/` as the parent directory (don't ask — just confirm)
   - If it does NOT exist, use AskUserQuestion to ask: "Where do you keep your projects? (e.g., ~/Code, ~/dev, ~/workspace)"
   - Use their answer as the parent directory

4. Run the shadcn init command from the **parent directory**:

   **IMPORTANT NOTES:**
   - `--monorepo` is a boolean flag, NOT followed by a project name
   - shadcn creates the project folder itself — do NOT pre-create it or cd into it
   - The CLI prompts for a project name interactively — pipe it via echo
   - Run from the PARENT directory (e.g., `~/Projects/`), NOT from inside a project folder
   - Always include `--preset` — the default is `b2D0wqNxT` (Radix Luma)

   ```bash
   cd {parent-directory}
   echo "{project-name}" | pnpm dlx shadcn@latest init --preset {preset-id} --template next --monorepo
   ```

   Use a 5-minute timeout — this installs dependencies.

   This creates `{parent-directory}/{project-name}/` with:
   - `apps/web/` — Next.js app
   - `packages/ui/` — shared shadcn component library
   - `pnpm-workspace.yaml`, `turbo.json`, etc.

5. Install all shadcn components:

   **IMPORTANT:** In a monorepo, `add --all` must target a specific workspace with `-c packages/ui`. Running from the monorepo root without `-c` will fail.

   ```bash
   cd {parent-directory}/{project-name}
   pnpm dlx shadcn@latest add --all -c packages/ui
   ```

   Use a 5-minute timeout — this installs many components.

6. Add the design system viewer app:

   Clone the design-system-template into `apps/design-system/`:

   ```bash
   cd {parent-directory}/{project-name}
   gh repo clone addisonk/design-system-template apps/design-system -- --depth 1
   rm -rf apps/design-system/.git
   ```

   Then update the `components.json` style field to match the project's style. Read the style from `packages/ui/components.json`:

   ```bash
   cd {parent-directory}/{project-name}
   STYLE=$(cat packages/ui/components.json | python3 -c "import sys,json; print(json.load(sys.stdin)['style'])")
   ```

   Update `apps/design-system/components.json` with the correct style value.

   Then sync the layout fonts — this is the ONE manual step. Copy the font imports and setup from `apps/web/app/layout.tsx` into `apps/design-system/app/layout.tsx`. The design-system layout must use the exact same font imports, variables, and className setup as the web app. Read `apps/web/app/layout.tsx` to see which fonts are imported (e.g., Geist, JetBrains_Mono, Merriweather) and update `apps/design-system/app/layout.tsx` to match. Keep the ThemeProvider and TooltipProvider wrapping.

   **NOTE:** Everything else is auto-detected — do NOT manually edit `page.tsx` or `design-system-view.tsx`:
   - Font names, labels (Body/Heading/Mono), and weights are read from `apps/web/app/layout.tsx` at build time
   - Icon library is read from `packages/ui/components.json` and dynamically imported via React context
   - Style is read from `packages/ui/components.json`
   - Colors, radius, and blocks all come from the CSS theme automatically

   Then install dependencies:

   ```bash
   cd {parent-directory}/{project-name}
   pnpm install
   ```

7. Initialize git and create the first commit:

   ```bash
   cd {parent-directory}/{project-name}
   git init
   git add -A
   git commit -m "chore: scaffold shadcn monorepo with all components + design system viewer"
   ```

8. Report the result:
   - Project path
   - Monorepo structure (`apps/web/`, `apps/design-system/`, `packages/ui/`)
   - Number of components installed (count `.tsx` files in `packages/ui/src/components/`)
   - Next steps:
     - `cd {project-name} && pnpm dev` — runs the main app
     - `cd {project-name} && pnpm --filter design-system dev` — runs the design system viewer
