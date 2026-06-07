-- =====================================================================
-- Tipo de contrato do funcionario (CLT/PJ) e encargos (carga tributaria)
-- CLT: custo = salario * (1 + charges_rate). PJ: custo = salario.
-- =====================================================================
alter table public.employees
  add column if not exists contract_type text not null default 'clt'
  check (contract_type in ('clt', 'pj'));

alter table public.employees
  add column if not exists charges_rate numeric(6,4) not null default 0.68;
