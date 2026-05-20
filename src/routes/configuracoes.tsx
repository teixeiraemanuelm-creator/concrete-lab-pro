import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({ component: Config });

function Config() {
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("m³");
  useEffect(() => {
    setNome(localStorage.getItem("cl_empresa") || "");
    setUnidade(localStorage.getItem("cl_unidade") || "m³");
  }, []);
  function save() {
    localStorage.setItem("cl_empresa", nome);
    localStorage.setItem("cl_unidade", unidade);
    toast.success("Configurações salvas");
  }
  return (
    <AppShell title="Configurações">
      <div className="space-y-4 bg-background border rounded-lg p-4">
        <div><Label>Nome da empresa</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><Label>Logo</Label><Input type="file" accept="image/*" disabled /><p className="text-xs text-muted-foreground mt-1">Em breve.</p></div>
        <div><Label>Unidade padrão de volume</Label>
          <Select value={unidade} onValueChange={setUnidade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="m³">m³</SelectItem><SelectItem value="litro">litro</SelectItem></SelectContent></Select>
        </div>
        <div><Label>Gerenciamento de usuários</Label><p className="text-xs text-muted-foreground">Em breve.</p></div>
        <Button onClick={save} className="w-full">Salvar</Button>
      </div>
    </AppShell>
  );
}
