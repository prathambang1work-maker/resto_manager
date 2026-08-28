-- ---------------------------------------------------------------------------
-- Embercard — Phase 3 migration
-- Run this in Supabase SQL Editor if you already ran supabase-schema.sql
-- before (Phase 2). Safe to run even if some of this already exists.
-- If you're setting up a brand new project, just run supabase-schema.sql
-- instead — it already includes everything below.
-- ---------------------------------------------------------------------------

-- Add the 'kitchen' role and a kitchen_id link on profiles ------------------

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('staff', 'admin', 'kitchen'));

alter table public.profiles
  add column if not exists kitchen_id uuid references public.kitchens(id) on delete set null;

-- Helper functions ------------------------------------------------------

create or replace function public.my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_kitchen_id()
returns uuid
language sql
stable
security definer
as $$
  select kitchen_id from public.profiles where id = auth.uid();
$$;

-- Replace the old blanket "any signed-in user" order policies with
-- role-scoped ones: kitchen accounts only see/update their own kitchen's
-- orders, and can't create or delete orders.

drop policy if exists "orders: signed-in read" on public.orders;
drop policy if exists "orders: signed-in write" on public.orders;
drop policy if exists "orders: read scoped" on public.orders;
drop policy if exists "orders: insert staff admin" on public.orders;
drop policy if exists "orders: update staff admin" on public.orders;
drop policy if exists "orders: kitchen mark ready" on public.orders;
drop policy if exists "orders: delete staff admin" on public.orders;

create policy "orders: read scoped"
  on public.orders for select
  using (
    public.my_role() in ('staff', 'admin')
    or (public.my_role() = 'kitchen' and kitchen_id = public.my_kitchen_id())
  );

create policy "orders: insert staff admin"
  on public.orders for insert
  with check (public.my_role() in ('staff', 'admin'));

create policy "orders: update staff admin"
  on public.orders for update
  using (public.my_role() in ('staff', 'admin'))
  with check (public.my_role() in ('staff', 'admin'));

create policy "orders: kitchen mark ready"
  on public.orders for update
  using (public.my_role() = 'kitchen' and kitchen_id = public.my_kitchen_id())
  with check (public.my_role() = 'kitchen' and kitchen_id = public.my_kitchen_id());

create policy "orders: delete staff admin"
  on public.orders for delete
  using (public.my_role() in ('staff', 'admin'));

-- ---------------------------------------------------------------------------
-- After running this: create a Supabase Auth user for each kitchen (or reuse
-- an existing one), then link it to a kitchen, e.g.:
--
--   update public.profiles
--   set role = 'kitchen',
--       kitchen_id = (select id from public.kitchens where name = 'Kitchen 1')
--   where email = 'kitchen1@embercard.app';
--
-- See README.md for the full step-by-step.
-- ---------------------------------------------------------------------------
