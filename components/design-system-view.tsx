"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import Color from "colorjs.io";
import type { DesignSystemConfig } from "@/lib/config";
// Icons are handled via static imports in the IconPlaceholder stubs
// The /create-new-project skill swaps the import to match the project's iconLibrary
import { ThemeTinker } from "@/components/theme-tinker";
import Preview02 from "@/components/blocks/preview-02/index";

const Preview = React.lazy(() => import("@/components/blocks/preview/index"));

class BlockErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Preview failed to render. Try the other preview.
        </div>
      );
    }
    return this.props.children;
  }
}

export function DesignSystemView({ config }: { config: DesignSystemConfig }) {
  return (
    <React.Suspense>
      <DesignSystemContent config={config} />
    </React.Suspense>
  );
}

function DesignSystemContent({ config }: { config: DesignSystemConfig }) {
  const [activePreview, setActivePreview] = React.useState<1 | 2>(2);
  const [tinkerOpen, setTinkerOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("section") as "type" | "color" | "radius" | "blocks" | null;

  const setFilter = (section: string | null) => {
    if (section) {
      router.push(`?section=${section}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const show = (section: string) => !filter || filter === section;

  const pills = [
    { id: "type", label: "Type" },
    { id: "color", label: "Color" },
    { id: "radius", label: "Radius" },
    { id: "blocks", label: "Blocks" },
  ];

  return (
    <main>
      {/* Header */}
      <div className="container mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Press D to toggle dark mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={tinkerOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setTinkerOpen(!tinkerOpen)}
            >
              {tinkerOpen ? "Close Tinker" : "Tinker"}
            </Button>
            <Select value={filter ?? "all"} onValueChange={(v) => setFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {pills.map((pill) => (
                  <SelectItem key={pill.id} value={pill.id}>{pill.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ThemeTinker enabled={tinkerOpen} colorTokens={config.colorTokens} />

      {/* ─── Typography ─── */}
      {show("type") && <>
      <Separator />
      <section className="container mx-auto max-w-7xl px-6 py-16 md:px-10">
        <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Typography
        </h2>

        {/* Heading font first — dynamic if added via tinker */}
        {!config.fonts.some(f => f.label === "Heading") && (
          <DynamicHeadingSection />
        )}

        {/* Sort: Heading first, then Body, then Mono */}
        {config.fonts
          .sort((a, b) => {
            const order = ["Heading", "Body", "Mono"];
            return order.indexOf(a.label) - order.indexOf(b.label);
          })
          .map((font, i, arr) => (
          <React.Fragment key={font.variable}>
            {(i > 0 || !config.fonts.some(f => f.label === "Heading")) && <Separator className="mb-24" />}
            <FontSection
              fontClass={font.fontClass}
              name={font.name}
              label={font.label}
              weights={font.weights}
            />
          </React.Fragment>
        ))}
      </section>
      </>}

      {/* ─── Color Palette ─── */}
      {show("color") && <>
      <Separator />
      <section className="container mx-auto max-w-7xl px-6 py-16 md:px-10">
        <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Color Palette
        </h2>

        <div className="mb-8 grid grid-cols-5 gap-px">
          <PaletteBlock bg="bg-primary" fg="text-primary-foreground" name="Primary" span="col-span-2 row-span-2" height={240} />
          <PaletteBlock bg="bg-secondary" fg="text-secondary-foreground" name="Secondary" />
          <PaletteBlock bg="bg-accent" fg="text-accent-foreground" name="Accent" />
          <PaletteBlock bg="bg-muted" fg="text-muted-foreground" name="Muted" />
          <PaletteBlock bg="bg-background" fg="text-foreground" name="Background" />
          <PaletteBlock bg="bg-card" fg="text-card-foreground" name="Card" />
          <PaletteBlock bg="bg-destructive" fg="text-destructive-foreground" name="Destructive" />
        </div>

        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Foregrounds & Utility</h3>
        <div className="mb-8 grid grid-cols-3 gap-px md:grid-cols-6" >
          <AutoContrastBlock bg="bg-foreground" name="Foreground" />
          <AutoContrastBlock bg="bg-primary-foreground" name="Primary FG" />
          <AutoContrastBlock bg="bg-secondary-foreground" name="Secondary FG" />
          <AutoContrastBlock bg="bg-muted-foreground" name="Muted FG" />
          <AutoContrastBlock bg="bg-border" name="Border" />
          <AutoContrastBlock bg="bg-ring" name="Ring" />
          <AutoContrastBlock bg="bg-input" name="Input" />
          <AutoContrastBlock bg="bg-popover" name="Popover" />
          <AutoContrastBlock bg="bg-popover-foreground" name="Popover FG" />
        </div>

        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Charts</h3>
        <div className="mb-8 grid grid-cols-5 gap-px">
          <AutoContrastBlock bg="bg-chart-1" name="Chart 1" />
          <AutoContrastBlock bg="bg-chart-2" name="Chart 2" />
          <AutoContrastBlock bg="bg-chart-3" name="Chart 3" />
          <AutoContrastBlock bg="bg-chart-4" name="Chart 4" />
          <AutoContrastBlock bg="bg-chart-5" name="Chart 5" />
        </div>

        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Sidebar</h3>
        <div className="mb-8 grid grid-cols-4 gap-px md:grid-cols-6" >
          <PaletteBlock bg="bg-sidebar" fg="text-sidebar-foreground" name="Sidebar" />
          <AutoContrastBlock bg="bg-sidebar-foreground" name="Sidebar FG" />
          <PaletteBlock bg="bg-sidebar-primary" fg="text-sidebar-primary-foreground" name="Sidebar Primary" />
          <PaletteBlock bg="bg-sidebar-accent" fg="text-sidebar-accent-foreground" name="Sidebar Accent" />
          <AutoContrastBlock bg="bg-sidebar-border" name="Sidebar Border" />
          <AutoContrastBlock bg="bg-sidebar-ring" name="Sidebar Ring" />
        </div>
      </section>
      </>}

      {/* ─── Radius ─── */}
      {show("radius") && <>
      <Separator />
      <section className="container mx-auto max-w-7xl px-6 py-16 md:px-10">
        <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Radius
        </h2>
        <div className="grid grid-cols-4 gap-16">
          {[
            { cls: "rounded-none", label: "none", value: "0" },
            { cls: "rounded-sm", label: "sm", cssVar: "--radius-sm" },
            { cls: "rounded-md", label: "md", cssVar: "--radius-md" },
            { cls: "rounded-lg", label: "lg", cssVar: "--radius-lg" },
            { cls: "rounded-xl", label: "xl", cssVar: "--radius-xl" },
            { cls: "rounded-2xl", label: "2xl", cssVar: "--radius-2xl" },
            { cls: "rounded-3xl", label: "3xl", cssVar: "--radius-3xl" },
            { cls: "rounded-4xl", label: "4xl", cssVar: "--radius-4xl" },
          ].map((r) => (
            <RadiusBlock key={r.cls} {...r} />
          ))}
        </div>
      </section>
      </>}

      {/* ─── Blocks ─── */}
      {show("blocks") && <>
      <Separator />
      <section className="container mx-auto max-w-7xl px-6 py-16 md:px-10">
        <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Blocks
        </h2>

        <div>
          <div className="relative rounded-2xl ring ring-foreground/10 dark:ring-foreground/10">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl shadow-[inset_0px_0px_17px_10px_var(--muted)] dark:shadow-[inset_0px_0px_17px_10px_var(--background)]" />
            <div className="relative rounded-2xl bg-muted dark:bg-muted/30">
              <div className="h-[80vh] overflow-scroll p-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <BlockErrorBoundary>
                  <React.Suspense
                    fallback={
                      <div className="flex h-96 items-center justify-center text-muted-foreground">
                        Loading...
                      </div>
                    }
                  >
                    {activePreview === 1 ? <Preview /> : <Preview02 />}
                  </React.Suspense>
                </BlockErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
          <button
            onClick={() => setActivePreview(1)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreview === 1 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            01
          </button>
          <button
            onClick={() => setActivePreview(2)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreview === 2 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            02
          </button>
        </div>
      </section>
      </>}
    </main>
  );
}

// ─── Sub-components ───

function PaletteBlock({
  bg, fg, name, span, height = 120,
}: {
  bg: string; fg: string; name: string; span?: string; height?: number;
}) {
  const fgName = fg.replace("text-", "");
  return (
    <div className={`relative ${bg} ${span ?? ""}`} style={{ minHeight: height }}>
      <span className={`absolute bottom-2 left-2 ${bg} ${fg} rounded px-2 py-1`}>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs opacity-80">{fgName}</p>
      </span>
    </div>
  );
}

function getContrastTextColor(fgColor: string, pageBgColor: string): string {
  try {
    let bg = new Color(fgColor);

    // If the color has alpha < 1, composite it over the page background
    if (bg.alpha < 1) {
      const pageBg = new Color(pageBgColor);
      // Manual alpha composite: result = alpha * fg + (1-alpha) * bg
      const alpha = bg.alpha;
      const fgSRGB = bg.to("srgb");
      const bgSRGB = pageBg.to("srgb");
      const r = alpha * fgSRGB.coords[0] + (1 - alpha) * bgSRGB.coords[0];
      const g = alpha * fgSRGB.coords[1] + (1 - alpha) * bgSRGB.coords[1];
      const b = alpha * fgSRGB.coords[2] + (1 - alpha) * bgSRGB.coords[2];
      bg = new Color("srgb", [r, g, b]);
    }

    const contrastBlack = bg.contrastWCAG21(new Color("black"));
    const contrastWhite = bg.contrastWCAG21(new Color("white"));
    return contrastBlack > contrastWhite ? "#000000" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

function AutoContrastBlock({ bg, name }: { bg: string; name: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const bgColor = window.getComputedStyle(ref.current).backgroundColor;
      const pageBg = window.getComputedStyle(document.body).backgroundColor;
      setTextColor(getContrastTextColor(bgColor, pageBg));
    };
    // Run after paint
    requestAnimationFrame(update);

    // Re-run when dark mode toggles
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${bg}`} style={{ minHeight: 100 }}>
      <p
        className="absolute bottom-2 left-2 text-sm font-medium"
        style={{ color: textColor ?? "transparent" }}
      >
        {name}
      </p>
    </div>
  );
}

function RadiusBlock({ cls, label, cssVar, value }: { cls: string; label: string; cssVar?: string; value?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = React.useState(value ?? "");

  React.useEffect(() => {
    if (!cssVar || !ref.current) return;
    const computed = window.getComputedStyle(ref.current).borderRadius;
    setResolved(computed);
  }, [cssVar]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={ref} className={`aspect-square w-full bg-muted ${cls}`} />
      <div className="text-center">
        <span className="font-mono text-xs text-foreground">{label}</span>
        <span className="block font-mono text-[10px] text-muted-foreground">{resolved}</span>
      </div>
    </div>
  );
}

function DynamicHeadingSection() {
  const [headingFont, setHeadingFont] = React.useState<string | null>(null);

  React.useEffect(() => {
    const check = () => {
      const val = document.documentElement.style.getPropertyValue("--font-heading");
      if (val && val.trim()) {
        const name = val.split(",")[0].trim().replace(/['"]/g, "");
        setHeadingFont(name);
      } else {
        setHeadingFont(null);
      }
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  if (!headingFont) return null;

  return (
    <>
      <Separator className="mb-24" />
      <div className="mb-24 last:mb-0">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Heading</p>
        <div className="text-6xl font-bold md:text-8xl mb-8" style={{ fontFamily: `"${headingFont}", serif` }}>{headingFont}</div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[280px_1fr_1fr]">
          <div className="text-[180px] leading-[0.8]" style={{ fontFamily: `"${headingFont}", serif` }}>Aa</div>
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Preview</p>
            <p className="text-xl leading-relaxed" style={{ fontFamily: `"${headingFont}", serif` }}>
              Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
            </p>
          </div>
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Numbers</p>
            <p className="text-xl font-medium" style={{ fontFamily: `"${headingFont}", serif` }}>
              0 1 2 3 4 5 6 7 8 9
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FontSection({
  fontClass, name: defaultName, label, weights,
}: {
  fontClass: string; name: string; label: string; weights: string[];
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = React.useState(defaultName);

  React.useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const computed = window.getComputedStyle(ref.current).fontFamily;
      // Extract the first font name, strip quotes
      const first = computed.split(",")[0].trim().replace(/['"]/g, "");
      if (first && first !== "serif" && first !== "sans-serif" && first !== "monospace") {
        setDisplayName(first);
      }
    };
    update();
    // Watch for style changes (tinker modifying CSS vars)
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mb-24 last:mb-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <div ref={ref} className={`${fontClass} text-6xl font-bold md:text-8xl mb-8`}>{displayName}</div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[280px_1fr_1fr]">
        <div className={`${fontClass} text-[180px] leading-[0.8]`}>Aa</div>
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Weights</p>
          <div className={`${fontClass} space-y-2`}>
            {weights.map((w) => {
              const wc = w === "Light" ? "font-light" : w === "Regular" ? "font-normal" : w === "Medium" ? "font-medium" : w === "Semibold" ? "font-semibold" : "font-bold";
              return <p key={w} className={`text-lg ${wc}`}>{w}</p>;
            })}
          </div>
        </div>
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Overview</p>
          <div className={`${fontClass} space-y-4`}>
            <p className="text-xl leading-relaxed">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz</p>
            <p className="text-xl font-medium">0 1 2 3 4 5 6 7 8 9</p>
            <p className="text-lg text-muted-foreground">! @ # $ % ^ &amp; * ( ) - + {"{"}{"}"} ?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
