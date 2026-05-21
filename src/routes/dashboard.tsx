import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Box, Layers, ClipboardList, ShieldCheck,
  Plus, FlaskConical, AlertTriangle, CheckCircle2,
  TrendingUp, ChevronRight, Sun, Moon, CloudSun, Award
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
  if (hour < 12) return { text: "Bom dia", Icon: Sun, color: "text-amber-500" };
  if (hour < 18) return { text: "Boa tarde", Icon: CloudSun, color: "text-orange-500" };
  return { text: "Boa noite", Icon: Moon, color: "text-indigo-500" };
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const greeting = getGreeting();
  const userName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    user?.email?.split("@")[0] ||
    "usuário";

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

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data: tracos } = await supabase
        .from("tracos")
        .select("id")
        .eq("status", "Ativo");
      let semTeste = 0;
      if (tracos && tracos.length > 0) {
        const ids = tracos.map((t: any) => t.id);
        const { data: testes } = await supabase
          .from("testes")
          .select("traco_id")
          .in("traco_id", ids);
        const comTeste = new Set((testes ?? []).map((t: any) => t.traco_id));
        semTeste = ids.filter((id: string) => !comTeste.has(id)).length;
      }

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: insumosDesatualizados } = await supabase
        .from("insumos")
        .select("*", { count: "exact", head: true })
        .lt("updated_at", cutoff);

      return { semTeste, insumosDesatualizados: insumosDesatualizados ?? 0 };
    },
  });

  const financeiro = useQuery({
    queryKey: ["financeiro-resumo"],
    queryFn: async () => {
      const { data: custos } = await supabase
        .from("custos")
        .select("traco_id, mao_de_obra, energia, manutencao, outros_fixos, qtd_pecas");
      if (!custos || custos.length === 0) {
        return { custoMedio: 0, economico: null as null | { nome: string; custo: number } };
      }

      // soma custo por lote = mao+energia+manut+outros (custo de traço/insumos ignorado aqui pela simplicidade)
      const totais = custos.map((c: any) =>
        Number(c.mao_de_obra) + Number(c.energia) + Number(c.manutencao) + Number(c.outros_fixos)
      );
      const custoMedio = totais.reduce((a, b) => a + b, 0) / totais.length;

      // mais econômico por traço (menor custo total)
      let minIdx = 0;
      totais.forEach((v, i) => { if (v < totais[minIdx]) minIdx = i; });
      const tracoId = custos[minIdx].traco_id;
      const { data: traco } = await supabase
        .from("tracos").select("nome").eq("id", tracoId).maybeSingle();

      return {
        custoMedio,
        economico: traco ? { nome: traco.nome, custo: totais[minIdx] } : null,
      };
    },
  });

  const d = counts.data ?? { produtos: 0, insumos: 0, tracos: 0, homologados: 0 };
  const al = alerts.data ?? { semTeste: 0, insumosDesatualizados: 0 };
  const fin = financeiro.data;
  const semAlertas = al.semTeste === 0 && al.insumosDesatualizados === 0;

  const statusColor: Record<string, string> = {
    Ativo: "bg-emerald-100 text-emerald-700",
    Inativo: "bg-gray-100 text-gray-600",
    Homologado: "bg-blue-100 text-blue-700",
  };

  const GreetIcon = greeting.Icon;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-5">

        {/* Saudação */}
        <div>
          <div className="flex items-center gap-2">
            <GreetIcon className={`h-5 w-5 ${greeting.color}`} />
            <p className="text-lg font-semibold">
              {greeting.text}, <span className="text-primary">{userName}</span>!
            </p>
          </div>
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
            {semAlertas ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Tudo em ordem ✓</span>
              </div>
            ) : (
              <>
                {al.semTeste > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="text-sm">
                      <strong>{al.semTeste}</strong> traço(s) sem teste laboratorial
                    </span>
                  </div>
                )}
                {al.insumosDesatualizados > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="text-sm">
                      <strong>{al.insumosDesatualizados}</strong> insumo(s) com custo desatualizado (+30 dias)
                    </span>
                  </div>
                )}
              </>
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
          {!fin || (fin.custoMedio === 0 && !fin.economico) ? (
            <div className="bg-background border rounded-xl p-4 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nenhum custeio registrado ainda</p>
                <p className="text-xs text-muted-foreground">
                  Acesse o módulo Custos para calcular
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/custos" })}
                className="text-primary"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="bg-background border rounded-xl divide-y">
              <div className="flex items-center gap-3 p-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Custo médio por lote</p>
                  <p className="text-sm font-semibold">
                    R$ {fin.custoMedio.toFixed(2)}
                  </p>
                </div>
              </div>
              {fin.economico && (
                <div className="flex items-center gap-3 p-3">
                  <div className="bg-emerald-100 rounded-lg p-2">
                    <Award className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Traço mais econômico</p>
                    <p className="text-sm font-semibold">
                      {fin.economico.nome}{" "}
                      <span className="text-emerald-700">
                        — R$ {fin.economico.custo.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate({ to: "/custos" })}
                    className="text-primary"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
