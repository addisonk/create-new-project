export function FontBlock({ className, name }: { className: string; name?: string }) {
  const label = name ?? className.replace("font-", "");
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="mb-1 font-mono text-xs text-muted-foreground">{className}</div>
      <div className={`mb-3 text-sm font-medium ${className}`}>{label}</div>
      <div className={`text-3xl leading-tight ${className}`}>The quick brown fox jumps over the lazy dog</div>
    </div>
  );
}
