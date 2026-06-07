-- =====================================================================
-- Meta de pro-labore e custo variavel medio (calculadora de metas)
-- =====================================================================
alter table public.cost_settings
  add column if not exists prolabore_goal numeric(12,2) not null default 0;

alter table public.cost_settings
  add column if not exists variable_cost_rate numeric(6,4) not null default 0.45;
