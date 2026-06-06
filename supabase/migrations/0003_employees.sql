-- =====================================================================
-- Minha Tapecaria: funcionarios e atribuicao de execucao no orcamento
-- =====================================================================

-- ---------------------------------------------------------------------
-- employees (funcionarios)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- budget_assignments (quem executa o orcamento e quantas horas)
-- ---------------------------------------------------------------------
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

-- updated_at trigger para employees
drop trigger if exists set_updated_at on public.employees;
create trigger set_updated_at before update on public.employees
  for each row execute function public.set_updated_at();

-- Row Level Security
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
