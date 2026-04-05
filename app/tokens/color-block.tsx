"use client";
export function ColorBlock({ name, className }: { name: string; className: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(name.toLowerCase().replace(/\s+/g, "-"))} className="group overflow-hidden rounded-lg border border-border transition-colors hover:border-foreground/20">
      <div className={`h-20 ${className}`} style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
      <div className="px-3 py-2 text-left"><div className="font-mono text-xs text-foreground">{name}</div></div>
    </button>
  );
}
