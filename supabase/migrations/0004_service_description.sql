-- =====================================================================
-- Descritivo do servico (texto que vai no orcamento do cliente)
-- =====================================================================
alter table public.budgets
  add column if not exists service_description text;
