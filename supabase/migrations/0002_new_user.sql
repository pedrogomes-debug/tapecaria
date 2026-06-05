-- =====================================================================
-- Provisionamento de novos usuarios
-- Cria profile, cost_settings, subscription e tipos de produto padrao
-- quando um usuario se cadastra em auth.users.
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

  -- Seed tipos de produto (moveis)
  insert into public.product_types (user_id, name, segment)
  select new.id, x.name, 'moveis'
  from (values
    ('Cadeira'), ('Poltrona'), ('Sofa'), ('Cama box'),
    ('Cabeceira'), ('Painel'), ('Cortina')
  ) as x(name);

  -- Seed tipos de produto (automotivo)
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
