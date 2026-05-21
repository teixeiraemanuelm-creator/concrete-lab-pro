-- ============================================
-- ConcretLab — Migração Evolutiva
-- Multi-tenant + Campos Completos + SaaS Ready
-- ============================================

-- 1. TABELA DE EMPRESAS
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  email text,
  telefone text,
  cidade text,
  estado text,
  plano text not null default 'free',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. VÍNCULO USUÁRIO ↔ EMPRESA
create table public.user_empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  role text not null default 'admin',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, empresa_id)
);

-- 3. ADICIONAR empresa_id NAS TABELAS EXISTENTES
alter table public.insumos
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade,
  add column if not exists subcategoria text,
  add column if not exists marca text,
  add column if not exists unidade_compra text default 'kg',
  add column if not exists fator_conversao numeric default 1.0,
  add column if not exists densidade numeric,
  add column if not exists consumo_referencia numeric,
  add column if not exists updated_at timestamptz default now();

alter table public.produtos
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade,
  add column if not exists subfamilia text,
  add column if not exists espessura numeric,
  add column if not exists unidade_venda text default 'unidade',
  add column if not exists cor text,
  add column if not exists acabamento text,
  add column if not exists aplicacao text,
  add column if not exists absorcao_alvo numeric,
  add column if not exists permeabilidade_alvo numeric,
  add column if not exists obs_tecnicas text,
  add column if not exists recomendacoes_uso text,
  add column if not exists obs_producao text,
  add column if not exists updated_at timestamptz default now();

alter table public.tracos
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade,
  add column if not exists produto_id uuid references public.produtos(id) on delete set null,
  add column if not exists responsavel text,
  add column if not exists processo text,
  add column if not exists pecas_por_traco numeric,
  add column if not exists m2_por_traco numeric,
  add column if not exists peso_por_peca numeric,
  add column if not exists unidades_pallet numeric,
  add column if not exists fator_perda numeric default 3.0,
  add column if not exists fator_refugo numeric default 2.0,
  add column if not exists nota_mistura text,
  add column if not exists nota_cura text,
  add column if not exists nota_producao text,
  add column if not exists updated_at timestamptz default now();

alter table public.traco_insumos
  add column if not exists observacao text,
  add column if not exists updated_at timestamptz default now();

alter table public.testes
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade,
  add column if not exists permeabilidade numeric,
  add column if not exists updated_at timestamptz default now();

alter table public.custos
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade,
  add column if not exists updated_at timestamptz default now();

-- 4. TABELA DE COMPARAÇÕES (Comparador Técnico)
create table public.comparacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text,
  traco_a_id uuid references public.tracos(id) on delete set null,
  traco_b_id uuid references public.tracos(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

-- 5. FASE 2 — ConcretNorms™ (estrutura base)
create table public.normas_checklist (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  traco_id uuid not null references public.tracos(id) on delete cascade,
  norma text not null,
  parametro text not null,
  valor_referencia text,
  valor_obtido text,
  conforme boolean,
  observacao text,
  created_at timestamptz not null default now()
);

-- 6. FASE 3 — ConcretLibrary™ (estrutura base)
create table public.biblioteca_tracos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  traco_id uuid not null references public.tracos(id) on delete cascade,
  categoria text,
  publico boolean default false,
  score_tecnico numeric,
  tags text[],
  created_at timestamptz not null default now()
);

-- 7. RLS — EMPRESAS
alter table public.empresas enable row level security;
alter table public.user_empresas enable row level security;
alter table public.comparacoes enable row level security;
alter table public.normas_checklist enable row level security;
alter table public.biblioteca_tracos enable row level security;

-- Usuário vê sua empresa
create policy "empresas own" on public.empresas for all
using (id in (
  select empresa_id from public.user_empresas
  where user_id = auth.uid() and ativo = true
));

-- Usuário vê seus vínculos
create policy "user_empresas own" on public.user_empresas for all
using (user_id = auth.uid());

-- Remover policies antigas (user_id puro) e adicionar empresa-aware
drop policy if exists "tracos own all" on public.tracos;
drop policy if exists "insumos own all" on public.insumos;
drop policy if exists "produtos own all" on public.produtos;
drop policy if exists "testes own all" on public.testes;
drop policy if exists "custos own all" on public.custos;

-- Novas policies: acesso via empresa OU user_id direto (retrocompatível)
create policy "tracos empresa" on public.tracos for all
using (
  user_id = auth.uid() or
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "insumos empresa" on public.insumos for all
using (
  user_id = auth.uid() or
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "produtos empresa" on public.produtos for all
using (
  user_id = auth.uid() or
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "testes empresa" on public.testes for all
using (
  user_id = auth.uid() or
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "custos empresa" on public.custos for all
using (
  user_id = auth.uid() or
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "comparacoes empresa" on public.comparacoes for all
using (
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "normas empresa" on public.normas_checklist for all
using (
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

create policy "biblioteca empresa" on public.biblioteca_tracos for all
using (
  empresa_id in (
    select empresa_id from public.user_empresas
    where user_id = auth.uid() and ativo = true
  )
);

-- 8. FUNÇÃO: onboarding automático de empresa
create or replace function public.criar_empresa_no_cadastro()
returns trigger language plpgsql security definer as $$
declare
  nova_empresa_id uuid;
begin
  insert into public.empresas (nome, email, plano)
  values (
    coalesce(new.raw_user_meta_data->>'empresa_nome', 'Minha Empresa'),
    new.email,
    'free'
  )
  returning id into nova_empresa_id;

  insert into public.user_empresas (user_id, empresa_id, role)
  values (new.id, nova_empresa_id, 'admin');

  return new;
end;
$$;

-- Trigger: cria empresa automaticamente ao cadastrar usuário
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.criar_empresa_no_cadastro();
