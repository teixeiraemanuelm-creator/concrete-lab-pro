import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FlaskConical, Calculator, GitCompare, Settings } from "lucide-react";

export const Route = createFileRoute("/mais")({ component: Mais });

const items = [
  { to: "/testes", label: "Testes Laboratoriais", icon: FlaskConical, desc: "Ensaios e resultados" },
  { to: "/custos", label: "Custos & Custeio", icon: Calculator, desc: "Formação de preço" },
  { to: "/comparador", label: "Comparador de Traços", icon: GitCompare, desc: "Análise lado a lado" },
  { to: "/configuracoes", label: "Configurações", icon: Settings, desc: "Empresa e preferências" },
];

function Mais() {
  return (
    <AppShell title="Mais">
      <div className="space-y-2">
        {items.map(it => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to} className="flex items-center gap-3 bg-background border rounded-lg p-4 hover:bg-accent">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
              <div>
                <div className="font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
