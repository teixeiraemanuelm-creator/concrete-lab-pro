import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.navigate({ to: "/dashboard" });
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-6">Plataforma Técnica para Artefatos de Concreto</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Dosagem, custeio e controle de qualidade em um só lugar
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Gerencie produtos, insumos e traços. Calcule custos, forme preços e registre testes de laboratório com rastreabilidade completa.
        </p>
        <div className="mt-8">
          <Link to="/auth">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
