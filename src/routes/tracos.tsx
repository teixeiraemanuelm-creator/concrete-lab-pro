import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TIPOS_TRACO, STATUS_TRACO, brl } from "@/lib/concretlab";

export const Route = createFileRoute("/tracos")({ component: Tracos });

function Tracos() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fTipo, setFTipo] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ["tracos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tracos").select("*, traco_insumos(*, insumos(nome,unidade,custo_unitario))").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: insumos } = useQuery({
    queryKey: ["insumos-min"],
    queryFn: async () => (await supabase.from("insumos").select("id,nome,unidade,custo_unitario").eq("status", "Ativo")).data ?? [],
  });

  const filtered = (list ?? []).filter((t: any) =>
    (fTipo === "todos" || t.tipo === fTipo) &&
    (fStatus === "todos" || t.status === fStatus) &&
    (!q || t.nome?.toLowerCase().includes(q.toLowerCase()) || t.codigo?.toLowerCase().includes(q.toLowerCase()))
  );

  async function nextCode() {
    const { count } = await supabase.from("tracos").select("*", { count: "exact", head: true });
    return `TR-${String((count ?? 0) + 1).padStart(3, "0")}`;
  }

  async function save(form: any, composicao: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const code = form.codigo || (await nextCode());
    const payload = {
      user_id: user.id,
      nome: form.nome, codigo: code, tipo: form.tipo,
      resistencia_alvo: form.resistencia_alvo ? Number(form.resistencia_alvo) : null,
      volume_lote: form.volume_lote ? Number(form.volume_lote) : null,
      status: form.status,
      versao: editing?.id ? (editing.versao || 1) + 1 : 1,
    };
    let tracoId = editing?.id;
    if (tracoId) {
      const { error } = await supabase.from("tracos").update(payload).eq("id", tracoId);
      if (error) return toast.error(error.message);
      await supabase.from("traco_insumos").delete().eq("traco_id", tracoId);
    } else {
      const { data, error } = await supabase.from("tracos").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      tracoId = data.id;
    }
    const rows = composicao.filter(c => c.insumo_id && Number(c.quantidade) > 0).map(c => ({
      traco_id: tracoId, insumo_id: c.insumo_id, quantidade: Number(c.quantidade),
      custo_calculado: Number(c.quantidade) * (insumos?.find(i => i.id === c.insumo_id)?.custo_unitario ?? 0),
    }));
    if (rows.length) {
      const { error } = await supabase.from("traco_insumos").insert(rows);
      if (error) return toast.error(error.message);
    }
    toast.success("Traço salvo");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["tracos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("tracos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["tracos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }

  return (
    <AppShell title="Traços">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Nome ou código" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={fTipo} onValueChange={setFTipo}><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos tipos</SelectItem>{TIPOS_TRACO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos status</SelectItem>{STATUS_TRACO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4 mr-1" /> Novo Traço</Button></DialogTrigger>
          <TracoForm key={editing?.id ?? "new"} initial={editing} insumos={insumos ?? []} onSave={save} />
        </Dialog>

        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum traço.</div>}
        <div className="space-y-2">
          {filtered.map((t: any) => {
            const totalCusto = (t.traco_insumos ?? []).reduce((s: number, x: any) => s + Number(x.custo_calculado || 0), 0);
            return (
              <div key={t.id} className="bg-background border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{t.codigo} — {t.nome}</div>
                    <div className="text-xs text-muted-foreground">{t.tipo} · v{t.versao} · {t.resistencia_alvo ?? "—"} MPa · {(t.traco_insumos?.length ?? 0)} insumos</div>
                    <div className="text-sm mt-1">Custo lote: <strong>{brl(totalCusto)}</strong></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={t.status === "Homologado" ? "default" : "secondary"}>{t.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir traço?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(t.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function TracoForm({ initial, insumos, onSave }: any) {
  const [f, setF] = useState({
    nome: initial?.nome ?? "", codigo: initial?.codigo ?? "",
    tipo: initial?.tipo ?? "Convencional",
    resistencia_alvo: initial?.resistencia_alvo ?? "",
    volume_lote: initial?.volume_lote ?? "",
    status: initial?.status ?? "Ativo",
  });
  const [comp, setComp] = useState<any[]>(
    initial?.traco_insumos?.map((x: any) => ({ insumo_id: x.insumo_id, quantidade: x.quantidade })) ?? [{ insumo_id: "", quantidade: "" }]
  );
  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));
  const setLine = (i: number, k: string, v: any) => setComp(c => c.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const total = comp.reduce((s, row) => {
    const insumo = insumos.find((i: any) => i.id === row.insumo_id);
    return s + (insumo ? Number(row.quantidade || 0) * Number(insumo.custo_unitario || 0) : 0);
  }, 0);

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial?.id ? "Editar" : "Novo"} Traço {initial?.id && `(v${(initial.versao || 1) + 1})`}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f, comp); }} className="space-y-3">
        <div><Label>Nome *</Label><Input required value={f.nome} onChange={e => set("nome", e.target.value)} /></div>
        <div><Label>Código (auto se vazio)</Label><Input value={f.codigo} onChange={e => set("codigo", e.target.value)} placeholder="TR-001" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Tipo</Label>
            <Select value={f.tipo} onValueChange={v => set("tipo", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS_TRACO.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={v => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_TRACO.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Resist. alvo (MPa)</Label><Input type="number" step="0.1" value={f.resistencia_alvo} onChange={e => set("resistencia_alvo", e.target.value)} /></div>
          <div><Label>Volume lote</Label><Input type="number" step="0.001" value={f.volume_lote} onChange={e => set("volume_lote", e.target.value)} /></div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <Label>Composição</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setComp(c => [...c, { insumo_id: "", quantidade: "" }])}>
              <Plus className="h-3 w-3 mr-1" /> Insumo
            </Button>
          </div>
          <div className="space-y-2">
            {comp.map((row, i) => {
              const insumo = insumos.find((x: any) => x.id === row.insumo_id);
              const custo = insumo ? Number(row.quantidade || 0) * Number(insumo.custo_unitario || 0) : 0;
              return (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select value={row.insumo_id} onValueChange={v => setLine(i, "insumo_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Insumo" /></SelectTrigger>
                      <SelectContent>{insumos.map((x: any) => <SelectItem key={x.id} value={x.id}>{x.nome} ({x.unidade})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input type="number" step="0.001" placeholder="Qtd" value={row.quantidade} onChange={e => setLine(i, "quantidade", e.target.value)} />
                  </div>
                  <div className="text-xs text-muted-foreground w-20 text-right pb-2">{brl(custo)}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setComp(c => c.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </div>
          <div className="text-right mt-2 font-semibold">Total lote: {brl(total)}</div>
        </div>
        <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
