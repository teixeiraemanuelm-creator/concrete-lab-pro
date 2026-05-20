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
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { IDADES, RESULTADOS } from "@/lib/concretlab";

export const Route = createFileRoute("/testes")({ component: Testes });

function Testes() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fRes, setFRes] = useState("todos");
  const [fIdade, setFIdade] = useState("todos");
  const [open, setOpen] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ["testes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testes").select("*, tracos(nome,codigo)").order("data_ensaio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: tracos } = useQuery({
    queryKey: ["tracos-min"],
    queryFn: async () => (await supabase.from("tracos").select("id,nome,codigo")).data ?? [],
  });

  const filtered = (list ?? []).filter((t: any) =>
    (fRes === "todos" || t.resultado === fRes) &&
    (fIdade === "todos" || String(t.idade_dias) === fIdade) &&
    (!q || t.lote?.toLowerCase().includes(q.toLowerCase()) || t.tracos?.nome?.toLowerCase().includes(q.toLowerCase()) || t.tracos?.codigo?.toLowerCase().includes(q.toLowerCase()))
  );

  async function save(form: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      ...form, user_id: user.id,
      idade_dias: Number(form.idade_dias),
      resistencia_obtida: form.resistencia_obtida ? Number(form.resistencia_obtida) : null,
      absorcao: form.absorcao ? Number(form.absorcao) : null,
    };
    const { error } = await supabase.from("testes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Teste registrado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["testes"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("testes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["testes"] });
  }

  return (
    <AppShell title="Testes Laboratoriais">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Traço ou lote" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={fRes} onValueChange={setFRes}><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos resultados</SelectItem>{RESULTADOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          <Select value={fIdade} onValueChange={setFIdade}><SelectTrigger className="flex-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todas idades</SelectItem>{IDADES.map(i => <SelectItem key={i} value={String(i)}>{i} dias</SelectItem>)}</SelectContent></Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4 mr-1" /> Novo Teste</Button></DialogTrigger>
          <TesteForm tracos={tracos ?? []} onSave={save} />
        </Dialog>

        {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        <div className="bg-background border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr><th className="text-left p-2">Traço</th><th className="text-left p-2">Data</th><th className="text-left p-2">Idade</th><th className="text-left p-2">MPa</th><th className="text-left p-2">Resultado</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.tracos?.codigo}</td>
                  <td className="p-2">{new Date(t.data_ensaio).toLocaleDateString("pt-BR")}</td>
                  <td className="p-2">{t.idade_dias}d</td>
                  <td className="p-2">{t.resistencia_obtida ?? "—"}</td>
                  <td className="p-2"><Badge variant={t.resultado === "Aprovado" ? "default" : "destructive"}>{t.resultado}</Badge></td>
                  <td className="p-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir teste?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(t.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum teste.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function TesteForm({ tracos, onSave }: any) {
  const [f, setF] = useState({
    traco_id: "", lote: "", data_ensaio: new Date().toISOString().slice(0, 10),
    idade_dias: "28", resistencia_obtida: "", absorcao: "", resultado: "Aprovado",
    responsavel: "", observacoes: "",
  });
  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));
  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo Teste</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-3">
        <div><Label>Traço *</Label>
          <Select value={f.traco_id} onValueChange={v => set("traco_id", v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tracos.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.codigo} — {t.nome}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>Lote de referência</Label><Input value={f.lote} onChange={e => set("lote", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Data</Label><Input type="date" value={f.data_ensaio} onChange={e => set("data_ensaio", e.target.value)} /></div>
          <div><Label>Idade</Label>
            <Select value={f.idade_dias} onValueChange={v => set("idade_dias", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{IDADES.map(i => <SelectItem key={i} value={String(i)}>{i} dias</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Resistência (MPa)</Label><Input type="number" step="0.1" value={f.resistencia_obtida} onChange={e => set("resistencia_obtida", e.target.value)} /></div>
          <div><Label>Absorção (%)</Label><Input type="number" step="0.01" value={f.absorcao} onChange={e => set("absorcao", e.target.value)} /></div>
        </div>
        <div><Label>Resultado</Label>
          <Select value={f.resultado} onValueChange={v => set("resultado", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESULTADOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>Responsável técnico</Label><Input value={f.responsavel} onChange={e => set("responsavel", e.target.value)} /></div>
        <div><Label>Observações</Label><Textarea value={f.observacoes} onChange={e => set("observacoes", e.target.value)} /></div>
        <DialogFooter><Button type="submit" disabled={!f.traco_id}>Salvar</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
