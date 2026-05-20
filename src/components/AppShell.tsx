import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Box, Layers, ClipboardList, MoreHorizontal, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/produtos", label: "Produtos", icon: Box },
  { to: "/insumos", label: "Insumos", icon: Layers },
  { to: "/tracos", label: "Traços", icon: ClipboardList },
  { to: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              router.navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        {title && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
        )}
      </header>
      <main className="max-w-3xl mx-auto px-4 py-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-30">
        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {items.map((it) => {
            const active = location.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center py-2 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
