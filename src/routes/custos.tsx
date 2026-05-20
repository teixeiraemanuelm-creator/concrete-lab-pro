import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { brl } from "@/lib/concretlab";

export const Route = createFileRoute("/custos")({ component: Custos });

function Custos() {
  const [f, setF] = useState({
    traco_id: "", produto_id: "",
    mao_de_obra: "", energia: "", manutencao: "", outros_fixos: "",
    qtd_pecas: "1", area_peca: "", margem: "30",
  });
  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));

  const { data: tracos } = useQuery({
    queryKey: ["tracos-custo"],
    queryFn: async () => (await supabase.from("tracos").select("id,nome,codigo, traco_insumos(custo_calculado)")).data ?? [],
  });
  const { data: produtos } = useQuery({
    queryKey: ["produtos-min"],
    queryFn: async () => (await supabase.from("produtos").select("id,nome,codigo")).data ?? [],
  });

  const calc = useMemo(() => {
    const t = tracos?.find(x => x.id === f.traco_id);
    const custoInsumos = (t?.traco_insumos ?? []).reduce((s: number, x: any) => s + Number(x.custo_calculado || 0), 0);
    const op = ["mao_de_obra", "energia", "manutencao", "outros_fixos"].reduce((s, k) => s + Number((f as any)[k] || 0), 0);
    const total = custoInsumos + op;
    const qtd = Math.max(1, Number(f.qtd_pecas || 1));
    const porPeca = total / qtd;
    const porM2 = f.area_peca ? porPeca / Number(f.area_peca) : null;
    const margem = Number(f.margem || 0) / 100;
    const preco = porPeca * (1 + margem);
    return { custoInsumos, op, total, porPeca, porM2, preco, margem: margem * 100 };
  }, [f, tracos]);

  async function salvar() {
    if (!f.traco_id) return toast.error("Selecione um traço");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("custos").insert({
      user_id: user.id, traco_id: f.traco_id,
      produto_id: f.produto_id || null,
      mao_de_obra: Number(f.mao_de_obra || 0),
      energia: Number(f.energia || 0),
      manutencao: Number(f.manutencao || 0),
      outros_fixos: Number(f.outros_fixos || 0),
      qtd_pecas: Number(f.qtd_pecas || 1),
      area_peca: f.area_peca ? Number(f.area_peca) : null,
      margem: Number(f.margem || 0),
    });
    if (error) return toast.error(error.message);
    toast.success("Custeio salvo");
  }

  return (
    <AppShell title="Custos & Custeio">
      <div className="space-y-3">
        <div className="bg-background border rounded-lg p-4 space-y-3">
          <div><Label>Traço *</Label>
            <Select value={f.traco_id} onValueChange={v => set("traco_id", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tracos?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.codigo} — {t.nome}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Produto (opcional)</Label>
            <Select value={f.produto_id || "none"} onValueChange={v => set("produto_id", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Nenhum</SelectItem>{produtos?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Mão de obra (R$)</Label><Input type="number" step="0.01" value={f.mao_de_obra} onChange={e => set("mao_de_obra", e.target.value)} /></div>
            <div><Label>Energia (R$)</Label><Input type="number" step="0.01" value={f.energia} onChange={e => set("energia", e.target.value)} /></div>
            <div><Label>Manutenção (R$)</Label><Input type="number" step="0.01" value={f.manutencao} onChange={e => set("manutencao", e.target.value)} /></div>
            <div><Label>Outros fixos (R$)</Label><Input type="number" step="0.01" value={f.outros_fixos} onChange={e => set("outros_fixos", e.target.value)} /></div>
            <div><Label>Peças por lote</Label><Input type="number" step="1" value={f.qtd_pecas} onChange={e => set("qtd_pecas", e.target.value)} /></div>
            <div><Label>Área/peça (m²)</Label><Input type="number" step="0.001" value={f.area_peca} onChange={e => set("area_peca", e.target.value)} /></div>
          </div>
          <div><Label>Margem (%)</Label><Input type="number" step="0.1" value={f.margem} onChange={e => set("margem", e.target.value)} /></div>
        </div>

        <div className="bg-primary text-primary-foreground rounded-lg p-4 space-y-2">
          <div className="text-sm opacity-80">Resultado</div>
          <Row label="Custo de insumos" value={brl(calc.custoInsumos)} />
          <Row label="Custo operacional" value={brl(calc.op)} />
          <Row label="Custo total do lote" value={brl(calc.total)} bold />
          <Row label="Custo por peça" value={brl(calc.porPeca)} />
          {calc.porM2 !== null && <Row label="Custo por m²" value={brl(calc.porM2)} />}
          <Row label="Preço sugerido / peça" value={brl(calc.preco)} bold />
          <Row label="Margem operacional" value={`${calc.margem.toFixed(1)}%`} />
        </div>

        <Button className="w-full" onClick={salvar}>Salvar custeio</Button>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold }: any) {
  return <div className={`flex justify-between ${bold ? "text-lg font-bold" : "text-sm"}`}><span>{label}</span><span>{value}</span></div>;
}
