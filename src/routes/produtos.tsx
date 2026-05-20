import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FAMILIAS, STATUS_BASIC } from "@/lib/concretlab";

export const Route = createFileRoute("/produtos")({ component: Produtos });

function Produtos() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fFam, setFFam] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*, tracos(nome,codigo)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: tracos } = useQuery({
    queryKey: ["tracos-min"],
    queryFn: async () => (await supabase.from("tracos").select("id,nome,codigo")).data ?? [],
  });

  const filtered = (list ?? []).filter((p: any) =>
    (fFam === "todos" || p.familia === fFam) &&
    (fStatus === "todos" || p.status === fStatus) &&
    (!q || p.nome?.toLowerCase().includes(q.toLowerCase()) || p.codigo?.toLowerCase().includes(q.toLowerCase()))
  );

  async function save(form: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...form, user_id: user.id, traco_id: form.traco_id || null };
    const { error } = editing?.id
      ? await supabase.from("produtos").update(payload).eq("id", editing.id)
      : await supabase.from("produtos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing?.id ? "Produto atualizado" : "Produto criado");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["produtos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["produtos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }

  return (
    <AppShell title="Produtos">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou código" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={fFam} onValueChange={setFFam}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Família" /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todas famílias</SelectItem>{FAMILIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos status</SelectItem>{STATUS_BASIC.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button></DialogTrigger>
          <ProdutoForm key={editing?.id ?? "new"} initial={editing} tracos={tracos ?? []} onSave={save} />
        </Dialog>

        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum produto encontrado.</div>}
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div key={p.id} className="bg-background border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">{p.codigo} · {p.familia}</div>
                  {(p.largura || p.altura || p.comprimento) && <div className="text-xs text-muted-foreground mt-1">{p.largura ?? "—"} × {p.altura ?? "—"} × {p.comprimento ?? "—"} cm</div>}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={p.status === "Ativo" ? "default" : "secondary"}>{p.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(p.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProdutoForm({ initial, tracos, onSave }: any) {
  const [f, setF] = useState({
    nome: initial?.nome ?? "",
    codigo: initial?.codigo ?? "",
    familia: initial?.familia ?? "Bloco",
    largura: initial?.largura ?? "",
    altura: initial?.altura ?? "",
    comprimento: initial?.comprimento ?? "",
    peso: initial?.peso ?? "",
    resistencia_alvo: initial?.resistencia_alvo ?? "",
    traco_id: initial?.traco_id ?? "",
    status: initial?.status ?? "Ativo",
    observacoes: initial?.observacoes ?? "",
  });
  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial?.id ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSave({
        ...f,
        largura: f.largura ? Number(f.largura) : null,
        altura: f.altura ? Number(f.altura) : null,
        comprimento: f.comprimento ? Number(f.comprimento) : null,
        peso: f.peso ? Number(f.peso) : null,
        resistencia_alvo: f.resistencia_alvo ? Number(f.resistencia_alvo) : null,
      }); }} className="space-y-3">
        <div><Label>Nome *</Label><Input required value={f.nome} onChange={e => set("nome", e.target.value)} /></div>
        <div><Label>Código interno</Label><Input value={f.codigo} onChange={e => set("codigo", e.target.value)} /></div>
        <div><Label>Família</Label>
          <Select value={f.familia} onValueChange={v => set("familia", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FAMILIAS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Larg (cm)</Label><Input type="number" step="0.01" value={f.largura} onChange={e => set("largura", e.target.value)} /></div>
          <div><Label>Alt (cm)</Label><Input type="number" step="0.01" value={f.altura} onChange={e => set("altura", e.target.value)} /></div>
          <div><Label>Comp (cm)</Label><Input type="number" step="0.01" value={f.comprimento} onChange={e => set("comprimento", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={f.peso} onChange={e => set("peso", e.target.value)} /></div>
          <div><Label>Resist. alvo (MPa)</Label><Input type="number" step="0.1" value={f.resistencia_alvo} onChange={e => set("resistencia_alvo", e.target.value)} /></div>
        </div>
        <div><Label>Traço vinculado</Label>
          <Select value={f.traco_id || "none"} onValueChange={v => set("traco_id", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Nenhum</SelectItem>{tracos.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.codigo} — {t.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_BASIC.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>Observações</Label><Textarea value={f.observacoes} onChange={e => set("observacoes", e.target.value)} /></div>
        <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
