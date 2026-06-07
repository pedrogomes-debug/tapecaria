-- =====================================================================
-- Tapecei SaaS - SETUP COMPLETO (cole tudo de uma vez no SQL Editor)
-- Junta as migrations 0001_init.sql e 0002_new_user.sql.
-- Pode rodar mais de uma vez com seguranca (idempotente).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text,
  owner_name text,
  segment text not null default 'ambos' check (segment in ('moveis','automotivo','ambos')),
  tax_regime text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pagarme_subscription_id text,
  pagarme_customer_id text,
  status text not null default 'none'
    check (status in ('trialing','active','past_due','canceled','pending','none')),
  plan text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text,
  address text,
  kind text default 'pessoa',
  vehicle_info text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients (user_id);

-- ---------------------------------------------------------------------
-- materials (materia-prima)
-- ---------------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'outro'
    check (category in ('tecido','madeira','chapa','espuma','plumante','aviamento','outro')),
  unit text not null default 'un',
  unit_cost numeric(12,2) not null default 0,
  supplier text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists materials_user_id_idx on public.materials (user_id);

-- ---------------------------------------------------------------------
-- cost_settings (um por usuario)
-- ---------------------------------------------------------------------
create table if not exists public.cost_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fixed_costs jsonb not null default '[]'::jsonb,
  productive_hours numeric(10,2) not null default 160,
  labor_hourly_rate numeric(12,2) not null default 25,
  default_tax_rate numeric(6,4) not null default 0.06,
  default_profit_margin numeric(6,4) not null default 0.30,
  default_card_fee numeric(6,4) not null default 0.0399,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------
-- product_types
-- ---------------------------------------------------------------------
create table if not exists public.product_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  segment text not null default 'moveis' check (segment in ('moveis','automotivo','ambos')),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists product_types_user_id_idx on public.product_types (user_id);

-- ---------------------------------------------------------------------
-- budgets (orcamentos)
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  product_type_id uuid references public.product_types (id) on delete set null,
  title text not null,
  segment text not null default 'moveis' check (segment in ('moveis','automotivo','ambos')),
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','aprovado','recusado')),
  materials_cost numeric(12,2) not null default 0,
  labor_hours numeric(10,2) not null default 0,
  labor_cost numeric(12,2) not null default 0,
  fixed_cost numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  tax_rate numeric(6,4) not null default 0,
  profit_margin numeric(6,4) not null default 0,
  card_fee numeric(6,4) not null default 0,
  sale_price numeric(12,2) not null default 0,
  profit_amount numeric(12,2) not null default 0,
  notes text,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_client_id_idx on public.budgets (client_id);

-- ---------------------------------------------------------------------
-- budget_items
-- ---------------------------------------------------------------------
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'material' check (kind in ('material','labor','extra')),
  material_id uuid references public.materials (id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text,
  unit_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists budget_items_budget_id_idx on public.budget_items (budget_id);

-- =====================================================================
-- updated_at trigger
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','subscriptions','cost_settings','budgets']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.clients enable row level security;
alter table public.materials enable row level security;
alter table public.cost_settings enable row level security;
alter table public.product_types enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;

-- profiles: id == auth.uid()
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- subscriptions: usuario so le a propria (escrita via service role)
drop policy if exists "subscriptions_select" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Helper macro para tabelas user_id padrao
do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients','materials','cost_settings','product_types','budgets','budget_items']
  loop
    execute format('drop policy if exists "%1$s_all" on public.%1$s;', tbl);
    execute format(
      'create policy "%1$s_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      tbl
    );
  end loop;
end;
$$;

-- =====================================================================
-- Provisionamento de novos usuarios (profile, custos, assinatura, produtos)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seg text := coalesce(new.raw_user_meta_data->>'segment', 'ambos');
  company text := coalesce(new.raw_user_meta_data->>'company_name', null);
  owner text := coalesce(new.raw_user_meta_data->>'owner_name', null);
begin
  insert into public.profiles (id, company_name, owner_name, segment)
  values (new.id, company, owner, seg)
  on conflict (id) do nothing;

  insert into public.cost_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, status)
  values (new.id, 'none')
  on conflict (user_id) do nothing;

  insert into public.product_types (user_id, name, segment)
  select new.id, x.name, 'moveis'
  from (values
    ('Cadeira'), ('Poltrona'), ('Sofa'), ('Cama box'),
    ('Cabeceira'), ('Painel'), ('Cortina')
  ) as x(name);

  insert into public.product_types (user_id, name, segment)
  select new.id, x.name, 'automotivo'
  from (values
    ('Bancos'), ('Portas'), ('Painel'), ('Teto'), ('Carpete')
  ) as x(name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Minha Tapecaria: funcionarios e atribuicao de execucao no orcamento
-- =====================================================================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  role text,
  monthly_salary numeric(12,2) not null default 0,
  monthly_hours numeric(8,2) not null default 220,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists employees_user_id_idx on public.employees (user_id);

create table if not exists public.budget_assignments (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  employee_id uuid references public.employees (id) on delete set null,
  name text not null,
  hours numeric(8,2) not null default 0,
  hourly_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists budget_assignments_budget_id_idx
  on public.budget_assignments (budget_id);

drop trigger if exists set_updated_at on public.employees;
create trigger set_updated_at before update on public.employees
  for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
alter table public.budget_assignments enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['employees','budget_assignments']
  loop
    execute format('drop policy if exists "%1$s_all" on public.%1$s;', tbl);
    execute format(
      'create policy "%1$s_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      tbl
    );
  end loop;
end;
$$;

-- =====================================================================
-- Descritivo do servico (texto que vai no orcamento do cliente)
-- =====================================================================
alter table public.budgets
  add column if not exists service_description text;

-- =====================================================================
-- Meta de pro-labore e custo variavel medio (calculadora de metas)
-- =====================================================================
alter table public.cost_settings
  add column if not exists prolabore_goal numeric(12,2) not null default 0;

alter table public.cost_settings
  add column if not exists variable_cost_rate numeric(6,4) not null default 0.45;

-- =====================================================================
-- Tipo de contrato do funcionario (CLT/PJ) e encargos (carga tributaria)
-- =====================================================================
alter table public.employees
  add column if not exists contract_type text not null default 'clt'
  check (contract_type in ('clt', 'pj'));

alter table public.employees
  add column if not exists charges_rate numeric(6,4) not null default 0.68;
