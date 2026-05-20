
-- ConcretLab schema
create table public.tracos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  codigo text not null,
  tipo text not null default 'Convencional',
  resistencia_alvo numeric,
  volume_lote numeric,
  status text not null default 'Ativo',
  versao integer not null default 1,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  codigo text,
  categoria text not null default 'Outro',
  unidade text not null default 'kg',
  custo_unitario numeric not null default 0,
  fornecedor text,
  status text not null default 'Ativo',
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  codigo text,
  familia text not null default 'Outro',
  largura numeric,
  altura numeric,
  comprimento numeric,
  peso numeric,
  resistencia_alvo numeric,
  traco_id uuid references public.tracos(id) on delete set null,
  status text not null default 'Ativo',
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.traco_insumos (
  id uuid primary key default gen_random_uuid(),
  traco_id uuid not null references public.tracos(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete restrict,
  quantidade numeric not null default 0,
  custo_calculado numeric not null default 0
);

create table public.testes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  traco_id uuid not null references public.tracos(id) on delete cascade,
  lote text,
  data_ensaio date not null default current_date,
  idade_dias integer not null default 28,
  resistencia_obtida numeric,
  absorcao numeric,
  resultado text not null default 'Aprovado',
  responsavel text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.custos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  traco_id uuid not null references public.tracos(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  mao_de_obra numeric not null default 0,
  energia numeric not null default 0,
  manutencao numeric not null default 0,
  outros_fixos numeric not null default 0,
  qtd_pecas numeric not null default 1,
  area_peca numeric,
  margem numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tracos enable row level security;
alter table public.insumos enable row level security;
alter table public.produtos enable row level security;
alter table public.traco_insumos enable row level security;
alter table public.testes enable row level security;
alter table public.custos enable row level security;

-- Owner-only policies (per-user data)
create policy "tracos own all" on public.tracos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insumos own all" on public.insumos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "produtos own all" on public.produtos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "testes own all" on public.testes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custos own all" on public.custos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- traco_insumos: access if parent traco belongs to user
create policy "traco_insumos via traco" on public.traco_insumos for all
using (exists (select 1 from public.tracos t where t.id = traco_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.tracos t where t.id = traco_id and t.user_id = auth.uid()));
