-- ---------------------------------------------------------------------------
-- Embercard — Supabase schema
-- Run this once in your Supabase project: SQL Editor -> New query -> paste
-- this whole file -> Run.
-- ---------------------------------------------------------------------------

-- Tables ----------------------------------------------------------------

create table public.kitchens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  kitchen_id uuid references public.kitchens(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  quantity int not null,
  price numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  kitchen_id uuid references public.kitchens(id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per login account, created after you add a user in
-- Authentication -> Users. Role controls what they can see/do.
-- 'kitchen' accounts are scoped to a single kitchen via kitchen_id.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('staff', 'admin', 'kitchen')),
  kitchen_id uuid references public.kitchens(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Row Level Security ------------------------------------------------------

alter table public.kitchens enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- Helper: is the current logged-in user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: a user can read their own profile row (needed so the app can
-- look up its own role after login).
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- kitchens: any signed-in user (staff or admin) can view; only admins can
-- add, rename, or delete kitchens.
create policy "kitchens: signed-in read"
  on public.kitchens for select
  using (auth.role() = 'authenticated');

create policy "kitchens: admin write"
  on public.kitchens for all
  using (public.is_admin())
  with check (public.is_admin());

-- menu_items: any signed-in user can view and manage — this is normal
-- day-to-day staff work (adding dishes, updating prices).
create policy "menu_items: signed-in read"
  on public.menu_items for select
  using (auth.role() = 'authenticated');

create policy "menu_items: signed-in write"
  on public.menu_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- orders: staff/admin see and manage everything. Kitchen accounts only
-- see and update orders assigned to their own kitchen (and can't insert
-- or delete orders — that stays a staff/admin action).

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

-- Realtime ------------------------------------------------------------------
-- Lets every open tab/device get live updates without polling.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.kitchens;

-- Optional starter data -----------------------------------------------------
-- Uncomment to seed 3 kitchens right away (you can also just add them from
-- the Admin screen in the app instead).

-- insert into public.kitchens (name) values
--   ('Kitchen 1'),
--   ('Kitchen 2'),
--   ('Kitchen 3');
