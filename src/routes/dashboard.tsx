import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Box, Layers, ClipboardList, ShieldCheck,
  Plus, FlaskConical, AlertTriangle, CheckCircle2,
  TrendingUp, ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-background rounded-xl border p-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️ Bom dia";
  if (hour < 18) return "🌤️ Boa tarde";
  return "🌙 Boa noite";
}

function Dashboard() {
  const navigate = useNavigate();

  const counts = useQuery({
    queryKey: ["counts"],
    queryFn: async () => {
      const [p, i, t, h] = await Promise.all([
        supabase.from("produtos").select("*", { count: "exact", head: true }),
        supabase.from("insumos").select("*", { count: "exact", head: true }),
        supabase.from("tracos").select("*", { count: "exact", head: true }),
        supabase.from("tracos").select("*", { count: "exact", head: true }).eq("status", "Homologado"),
      ]);
      return {
        produtos: p.count ?? 0,
        insumos: i.count ?? 0,
        tracos: t.count ?? 0,
        homologados: h.count ?? 0,
      };
    },
  });

  const recentInsumos = useQuery({
    queryKey: ["recent-insumos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("insumos")
        .select("id, nome, categoria, custo_unitario, unidade")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const recentTracos = useQuery({
    queryKey: ["recent-tracos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracos")
        .select("id, nome, tipo, status")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const tracosWithoutTests = useQuery({
    queryKey: ["tracos-sem-teste"],
    queryFn: async () => {
      const { data: tracos } = await supabase
        .from("tracos")
        .select("id")
        .eq("status", "Ativo");
      if (!tracos || tracos.length === 0) return 0;
      const ids = tracos.map((t: any) => t.id);
      const { data: testes } = await supabase
        .from("testes")
        .select("traco_id")
        .in("traco_id", ids);
      const comTeste = new Set((testes ?? []).map((t: any) => t.traco_id));
      return ids.filter((id: string) => !comTeste.has(id)).length;
    },
  });

  const d = counts.data ?? { produtos: 0, insumos: 0, tracos: 0, homologados: 0 };
  const semTeste = tracosWithoutTests.data ?? 0;

  const statusColor: Record<string, string> = {
    Ativo: "bg-emerald-100 text-emerald-700",
    Inativo: "bg-gray-100 text-gray-600",
    Homologado: "bg-blue-100 text-blue-700",
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-5">

        {/* Saudação */}
        <div>
          <p className="text-lg font-semibold">{getGreeting()}!</p>
          <p className="text-sm text-muted-foreground">
            Aqui está o resumo da sua operação
          </p>
        </div>

        {/* Cards de contagem */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Produtos" value={d.produtos} icon={Box} color="bg-primary" />
          <StatCard label="Insumos" value={d.insumos} icon={Layers} color="bg-emerald-600" />
          <StatCard label="Traços" value={d.tracos} icon={ClipboardList} color="bg-orange-500" />
          <StatCard label="Homologados" value={d.homologados} icon={ShieldCheck} color="bg-emerald-600" />
        </div>

        {/* Ações rápidas */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">AÇÕES RÁPIDAS</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate({ to: "/insumos" })}
              className="flex flex-col items-center gap-1 bg-background border rounded-xl p-3 text-xs font-medium hover:bg-muted transition-colors"
            >
              <div className="bg-emerald-100 rounded-lg p-2">
                <Plus className="h-4 w-4 text-emerald-700" />
              </div>
              Novo Insumo
            </button>
            <button
              onClick={() => navigate({ to: "/tracos" })}
              className="flex flex-col items-center gap-1 bg-background border rounded-xl p-3 text-xs font-medium hover:bg-muted transition-colors"
            >
              <div className="bg-orange-100 rounded-lg p-2">
                <Plus className="h-4 w-4 text-orange-600" />
              </div>
              Novo Traço
            </button>
            <button
              onClick={() => navigate({ to: "/testes" })}
              className="flex flex-col items-center gap-1 bg-background border rounded-xl p-3 text-xs font-medium hover:bg-muted transition-colors"
            >
              <div className="bg-blue-100 rounded-lg p-2">
                <FlaskConical className="h-4 w-4 text-blue-600" />
              </div>
              Novo Teste
            </button>
          </div>
        </div>

        {/* Alertas */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">ALERTAS</p>
          <div className="bg-background border rounded-xl p-4 space-y-2">
            {semTeste === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Tudo em ordem ✓</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">
                  <strong>{semTeste}</strong> traço(s) sem teste laboratorial
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Últimos Insumos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-muted-foreground">ÚLTIMOS INSUMOS</p>
            <button
              onClick={() => navigate({ to: "/insumos" })}
              className="text-xs text-primary flex items-center gap-0.5"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="bg-background border rounded-xl divide-y">
            {recentInsumos.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Nenhum insumo cadastrado ainda
              </p>
            ) : (
              recentInsumos.data?.map((ins: any) => (
                <div key={ins.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{ins.nome}</p>
                    <p className="text-xs text-muted-foreground">{ins.categoria}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    R$ {Number(ins.custo_unitario).toFixed(2)}/{ins.unidade}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimos Traços */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-muted-foreground">ÚLTIMOS TRAÇOS</p>
            <button
              onClick={() => navigate({ to: "/tracos" })}
              className="text-xs text-primary flex items-center gap-0.5"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="bg-background border rounded-xl divide-y">
            {recentTracos.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Nenhum traço cadastrado ainda
              </p>
            ) : (
              recentTracos.data?.map((tr: any) => (
                <div key={tr.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{tr.nome}</p>
                    <p className="text-xs text-muted-foreground">{tr.tipo}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[tr.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {tr.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumo financeiro */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">FINANCEIRO</p>
          <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Custeio de produção</p>
              <p className="text-xs text-muted-foreground">
                Acesse o módulo Custos para calcular
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/custos" })}
              className="ml-auto text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
