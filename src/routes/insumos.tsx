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
import { CATEGORIAS_INSUMO, UNIDADES, STATUS_BASIC, brl } from "@/lib/concretlab";

export const Route = createFileRoute("/insumos")({ component: Insumos });

function Insumos() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ["insumos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insumos").select("*, traco_insumos(traco_id)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (list ?? []).filter((p: any) =>
    (fCat === "todos" || p.categoria === fCat) &&
    (fStatus === "todos" || p.status === fStatus) &&
    (!q || p.nome?.toLowerCase().includes(q.toLowerCase()) || p.codigo?.toLowerCase().includes(q.toLowerCase()) || p.fornecedor?.toLowerCase().includes(q.toLowerCase()))
  );

  async function save(form: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...form, user_id: user.id, custo_unitario: Number(form.custo_unitario) || 0 };
    const { error } = editing?.id
      ? await supabase.from("insumos").update(payload).eq("id", editing.id)
      : await supabase.from("insumos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["insumos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("insumos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["insumos"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }

  return (
    <AppShell title="Insumos">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Nome, código ou fornecedor" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={fCat} onValueChange={setFCat}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todas categorias</SelectItem>{CATEGORIAS_INSUMO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos status</SelectItem>{STATUS_BASIC.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4 mr-1" /> Novo Insumo</Button></DialogTrigger>
          <InsumoForm key={editing?.id ?? "new"} initial={editing} onSave={save} />
        </Dialog>

        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum insumo.</div>}
        <div className="space-y-2">
          {filtered.map((i: any) => (
            <div key={i.id} className="bg-background border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{i.nome}</div>
                  <div className="text-xs text-muted-foreground">{i.categoria}{i.fornecedor ? ` · ${i.fornecedor}` : ""}</div>
                  <div className="text-sm mt-1">{brl(i.custo_unitario)} / {i.unidade} · {(i.traco_insumos?.length ?? 0)} traço(s)</div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={i.status === "Ativo" ? "default" : "secondary"}>{i.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir insumo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(i.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
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

function InsumoForm({ initial, onSave }: any) {
  const [f, setF] = useState({
    nome: initial?.nome ?? "", codigo: initial?.codigo ?? "",
    categoria: initial?.categoria ?? "Cimento", unidade: initial?.unidade ?? "kg",
    custo_unitario: initial?.custo_unitario ?? "", fornecedor: initial?.fornecedor ?? "",
    status: initial?.status ?? "Ativo", observacoes: initial?.observacoes ?? "",
  });
  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial?.id ? "Editar" : "Novo"} Insumo</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-3">
        <div><Label>Nome *</Label><Input required value={f.nome} onChange={e => set("nome", e.target.value)} /></div>
        <div><Label>Código</Label><Input value={f.codigo} onChange={e => set("codigo", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Categoria</Label>
            <Select value={f.categoria} onValueChange={v => set("categoria", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIAS_INSUMO.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><Label>Unidade</Label>
            <Select value={f.unidade} onValueChange={v => set("unidade", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIDADES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div><Label>Custo unitário (R$) *</Label><Input required type="number" step="0.0001" value={f.custo_unitario} onChange={e => set("custo_unitario", e.target.value)} /></div>
        <div><Label>Fornecedor</Label><Input value={f.fornecedor} onChange={e => set("fornecedor", e.target.value)} /></div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_BASIC.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>Observações</Label><Textarea value={f.observacoes} onChange={e => set("observacoes", e.target.value)} /></div>
        <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
