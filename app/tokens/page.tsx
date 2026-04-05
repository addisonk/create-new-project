import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { ColorBlock } from "./color-block";
import { FontBlock } from "./font-block";

export default function TokensPage() {
  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/"><ArrowLeft className="mr-2 size-4" />Back</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Design Tokens</h1>
        <p className="mt-1 text-muted-foreground">Press D to toggle dark mode.</p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Typography</h2>
        <div className="grid grid-cols-1 gap-4">
          <FontBlock className="font-sans" />
          <FontBlock className="font-serif" />
          <FontBlock className="font-mono" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Primary</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorBlock name="Background" className="bg-background" />
          <ColorBlock name="Foreground" className="bg-foreground" />
          <ColorBlock name="Primary" className="bg-primary" />
          <ColorBlock name="Primary Foreground" className="bg-primary-foreground" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Secondary & Accent</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorBlock name="Secondary" className="bg-secondary" />
          <ColorBlock name="Secondary Foreground" className="bg-secondary-foreground" />
          <ColorBlock name="Accent" className="bg-accent" />
          <ColorBlock name="Accent Foreground" className="bg-accent-foreground" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">UI Components</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorBlock name="Card" className="bg-card" />
          <ColorBlock name="Card Foreground" className="bg-card-foreground" />
          <ColorBlock name="Popover" className="bg-popover" />
          <ColorBlock name="Popover Foreground" className="bg-popover-foreground" />
          <ColorBlock name="Muted" className="bg-muted" />
          <ColorBlock name="Muted Foreground" className="bg-muted-foreground" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Utility</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <ColorBlock name="Border" className="bg-border" />
          <ColorBlock name="Input" className="bg-input" />
          <ColorBlock name="Ring" className="bg-ring" />
          <ColorBlock name="Destructive" className="bg-destructive" />
          <ColorBlock name="Destructive Foreground" className="bg-destructive-foreground" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Charts</h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
          <ColorBlock name="Chart 1" className="bg-chart-1" />
          <ColorBlock name="Chart 2" className="bg-chart-2" />
          <ColorBlock name="Chart 3" className="bg-chart-3" />
          <ColorBlock name="Chart 4" className="bg-chart-4" />
          <ColorBlock name="Chart 5" className="bg-chart-5" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Sidebar</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ColorBlock name="Sidebar" className="bg-sidebar" />
          <ColorBlock name="Sidebar Foreground" className="bg-sidebar-foreground" />
          <ColorBlock name="Sidebar Primary" className="bg-sidebar-primary" />
          <ColorBlock name="Sidebar Primary Foreground" className="bg-sidebar-primary-foreground" />
          <ColorBlock name="Sidebar Accent" className="bg-sidebar-accent" />
          <ColorBlock name="Sidebar Accent Foreground" className="bg-sidebar-accent-foreground" />
          <ColorBlock name="Sidebar Border" className="bg-sidebar-border" />
          <ColorBlock name="Sidebar Ring" className="bg-sidebar-ring" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-semibold text-xl">Radius</h2>
        <div className="flex flex-wrap gap-6">
          {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-4xl"].map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <div className={`h-20 w-20 border-2 border-foreground ${r}`} />
              <span className="font-mono text-[11px] text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
