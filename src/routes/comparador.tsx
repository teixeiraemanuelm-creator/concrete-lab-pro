import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { brl } from "@/lib/concretlab";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/comparador")({ component: Comparador });

function Comparador() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const { data: tracos } = useQuery({
    queryKey: ["tracos-comp"],
    queryFn: async () => (await supabase.from("tracos").select("*, traco_insumos(*, insumos(nome,categoria,custo_unitario))")).data ?? [],
  });

  const A = tracos?.find(t => t.id === a);
  const B = tracos?.find(t => t.id === b);

  const summarize = (t: any) => {
    if (!t) return null;
    const custoTotal = (t.traco_insumos ?? []).reduce((s: number, x: any) => s + Number(x.custo_calculado || 0), 0);
    const cimento = (t.traco_insumos ?? []).filter((x: any) => x.insumos?.categoria === "Cimento").reduce((s: number, x: any) => s + Number(x.quantidade || 0), 0);
    return { custoTotal, cimento, custoPorKgCimento: cimento ? custoTotal / cimento : 0, resistencia: t.resistencia_alvo ?? 0, insumos: t.traco_insumos ?? [] };
  };
  const sA = summarize(A);
  const sB = summarize(B);

  return (
    <AppShell title="Comparador de Traços">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Traço A</Label>
            <Select value={a} onValueChange={setA}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{tracos?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.codigo}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Traço B</Label>
            <Select value={b} onValueChange={setB}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{tracos?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.codigo}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>

        {sA && sB && (
          <div className="bg-background border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-2">Métrica</th><th className="text-left p-2">{A?.codigo}</th><th className="text-left p-2">{B?.codigo}</th></tr></thead>
              <tbody>
                <CompRow label="Custo total" a={brl(sA.custoTotal)} b={brl(sB.custoTotal)} winner={sA.custoTotal < sB.custoTotal ? "a" : "b"} note="menor" />
                <CompRow label="Custo/kg cimento" a={brl(sA.custoPorKgCimento)} b={brl(sB.custoPorKgCimento)} winner={sA.custoPorKgCimento < sB.custoPorKgCimento ? "a" : "b"} note="menor" />
                <CompRow label="Resistência alvo (MPa)" a={sA.resistencia} b={sB.resistencia} winner={sA.resistencia > sB.resistencia ? "a" : "b"} note="maior" />
                <CompRow label="Nº insumos" a={sA.insumos.length} b={sB.insumos.length} />
              </tbody>
            </table>
          </div>
        )}
        {(!sA || !sB) && <div className="text-sm text-muted-foreground text-center py-8">Selecione dois traços para comparar.</div>}
      </div>
    </AppShell>
  );
}

function CompRow({ label, a, b, winner, note }: any) {
  return (
    <tr className="border-t">
      <td className="p-2 text-muted-foreground">{label}</td>
      <td className={`p-2 ${winner === "a" ? "font-bold text-primary" : ""}`}>{a} {winner === "a" && note && <Trophy className="inline h-3 w-3 ml-1" />}</td>
      <td className={`p-2 ${winner === "b" ? "font-bold text-primary" : ""}`}>{b} {winner === "b" && note && <Trophy className="inline h-3 w-3 ml-1" />}</td>
    </tr>
  );
}
