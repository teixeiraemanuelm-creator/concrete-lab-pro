import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Box, Layers, ClipboardList, ShieldCheck } from "lucide-react";

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

function Dashboard() {
  const counts = useQuery({
    queryKey: ["counts"],
    queryFn: async () => {
      const [p, i, t, h] = await Promise.all([
        supabase.from("produtos").select("*", { count: "exact", head: true }),
        supabase.from("insumos").select("*", { count: "exact", head: true }),
        supabase.from("tracos").select("*", { count: "exact", head: true }),
        supabase.from("tracos").select("*", { count: "exact", head: true }).eq("status", "Homologado"),
      ]);
      return { produtos: p.count ?? 0, insumos: i.count ?? 0, tracos: t.count ?? 0, homologados: h.count ?? 0 };
    },
  });
  const d = counts.data ?? { produtos: 0, insumos: 0, tracos: 0, homologados: 0 };
  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Produtos" value={d.produtos} icon={Box} color="bg-primary" />
        <StatCard label="Insumos" value={d.insumos} icon={Layers} color="bg-emerald-600" />
        <StatCard label="Traços" value={d.tracos} icon={ClipboardList} color="bg-orange-500" />
        <StatCard label="Homologados" value={d.homologados} icon={ShieldCheck} color="bg-emerald-600" />
      </div>
    </AppShell>
  );
}
