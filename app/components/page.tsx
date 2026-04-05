import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Switch } from "@workspace/ui/components/switch";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Progress } from "@workspace/ui/components/progress";
import { Textarea } from "@workspace/ui/components/textarea";
import { Alert, AlertTitle, AlertDescription } from "@workspace/ui/components/alert";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Toggle } from "@workspace/ui/components/toggle";
import { Slider } from "@workspace/ui/components/slider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/"><ArrowLeft className="mr-2 size-4" />Back</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Components</h1>
        <p className="mt-1 text-muted-foreground">All shadcn components rendered with your theme</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Button">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </Section>
        <Section title="Badge">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </Section>
        <Section title="Card">
          <Card className="w-full">
            <CardHeader><CardTitle>Card Title</CardTitle><CardDescription>Description</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Content area</p></CardContent>
            <CardFooter className="flex justify-between"><Button variant="outline">Cancel</Button><Button>Submit</Button></CardFooter>
          </Card>
        </Section>
        <Section title="Input">
          <div className="grid w-full gap-4">
            <div className="grid gap-1.5"><Label htmlFor="e">Email</Label><Input type="email" id="e" placeholder="Email" /></div>
            <div className="grid gap-1.5"><Label htmlFor="d">Disabled</Label><Input disabled id="d" placeholder="Disabled" /></div>
          </div>
        </Section>
        <Section title="Textarea">
          <div className="grid w-full gap-1.5"><Label htmlFor="m">Message</Label><Textarea placeholder="Type here..." id="m" /></div>
        </Section>
        <Section title="Checkbox & Switch">
          <div className="grid gap-4">
            <div className="flex items-center space-x-2"><Checkbox id="t" /><Label htmlFor="t">Accept terms</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="c" defaultChecked /><Label htmlFor="c">Checked</Label></div>
            <div className="flex items-center space-x-2"><Switch id="a" /><Label htmlFor="a">Airplane Mode</Label></div>
          </div>
        </Section>
        <Section title="Alert">
          <div className="grid w-full gap-4">
            <Alert><AlertTitle>Default</AlertTitle><AlertDescription>This is a default alert.</AlertDescription></Alert>
            <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong.</AlertDescription></Alert>
          </div>
        </Section>
        <Section title="Avatar">
          <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>CD</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>EF</AvatarFallback></Avatar>
        </Section>
        <Section title="Progress & Slider">
          <div className="w-full space-y-4"><Progress value={33} /><Progress value={66} /><Slider defaultValue={[50]} max={100} step={1} /></div>
        </Section>
        <Section title="Skeleton">
          <div className="flex items-center space-x-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></div>
        </Section>
        <Section title="Toggle">
          <Toggle aria-label="Bold"><span className="font-bold">B</span></Toggle>
          <Toggle aria-label="Italic"><span className="italic">I</span></Toggle>
          <Toggle variant="outline" aria-label="Underline"><span className="underline">U</span></Toggle>
        </Section>
        <Section title="Separator">
          <div className="w-full">
            <div className="space-y-1"><h4 className="text-sm font-medium">Design System</h4><p className="text-sm text-muted-foreground">Tokens and components.</p></div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm"><div>Tokens</div><Separator orientation="vertical" /><div>Components</div><Separator orientation="vertical" /><div>Blocks</div></div>
          </div>
        </Section>
        <Section title="Table">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">Token Audit</TableCell><TableCell>Complete</TableCell><TableCell className="text-right">$250.00</TableCell></TableRow><TableRow><TableCell className="font-medium">Component Review</TableCell><TableCell>In Progress</TableCell><TableCell className="text-right">$150.00</TableCell></TableRow></TableBody></Table>
        </Section>
      </div>
    </div>
  );
}
