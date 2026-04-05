import Link from "next/link";

export default function Home() {
  return (
    <main className="container mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="mt-1 text-muted-foreground">
          Tokens, typography, and component previews. Press D to toggle dark mode.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/tokens" className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20">
          <h2 className="mb-2 font-semibold">Tokens</h2>
          <p className="text-sm text-muted-foreground">Colors, typography, spacing, and radius</p>
        </Link>
        <Link href="/components" className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20">
          <h2 className="mb-2 font-semibold">Components</h2>
          <p className="text-sm text-muted-foreground">Preview all shadcn components with your theme</p>
        </Link>
        <Link href="/blocks" className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20">
          <h2 className="mb-2 font-semibold">Blocks</h2>
          <p className="text-sm text-muted-foreground">Composite card layouts from shadcn</p>
        </Link>
      </div>
    </main>
  );
}
