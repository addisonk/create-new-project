"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
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
        <div className="container mx-auto max-w-7xl p-10 text-center text-muted-foreground">
          Preview failed to render: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BlocksPage() {
  const [active, setActive] = useState<1 | 2>(2);

  return (
    <div>
      <div className="container mx-auto max-w-7xl p-6 md:p-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Blocks</h1>
        <p className="mt-1 text-muted-foreground">
          Composite card layouts from shadcn — rendered with your theme
        </p>
      </div>

      {/* Preview container — rounded with ring, scrollable with hidden scrollbar */}
      <div className="mx-6 mt-4 md:mx-10">
        <div className="relative overflow-hidden rounded-2xl ring ring-foreground/10 dark:ring-foreground/10">
          <div className="relative bg-muted dark:bg-background">
            <div className="h-[80vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <BlockErrorBoundary>
                <React.Suspense
                  fallback={
                    <div className="flex h-96 items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  }
                >
                  {active === 1 ? <Preview /> : <Preview02 />}
                </React.Suspense>
              </BlockErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle — bottom right like shadcn */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
        <button
          onClick={() => setActive(1)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active === 1
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          01
        </button>
        <button
          onClick={() => setActive(2)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active === 2
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          02
        </button>
      </div>
    </div>
  );
}
