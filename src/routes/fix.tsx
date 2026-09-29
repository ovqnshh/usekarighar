import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import heroImage from "@/assets/karighar-hero.jpg";

export const Route = createFileRoute("/fix")({
  component: FixPage,
});

function FixPage() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <main>
        <section className="px-5 pt-8 lg:px-10 pb-16">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl">
            <img src={heroImage} width={1536} height={1024} alt="Fix and repair" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-foreground/10" />
            <div className="relative flex min-h-[500px] flex-col items-center justify-end px-5 pb-12 text-center">
              <Wrench className="size-16 text-primary mb-6" />
              <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] text-primary-foreground md:text-7xl">Fast, reliable fixes</h1>
              <p className="mt-4 max-w-xl text-lg text-primary-foreground/85 md:text-xl">Leaking pipes, broken tiles, or electrical issues. Get them sorted quickly.</p>
              <Button onClick={() => navigate({ to: "/", search: { intent: "fix" } })} size="lg" className="mt-8 h-14 rounded-full px-8 text-lg font-semibold">Describe the issue</Button>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
