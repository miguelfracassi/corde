-- Rode no SQL Editor do Supabase
create table products(id uuid primary key default gen_random_uuid(),name text not null,description text,price_cents int not null check(price_cents>0),created_at timestamptz default now());
create table invoices(
  id uuid primary key default gen_random_uuid(), code text unique not null,
  user_id uuid not null references auth.users on delete cascade,
  subscription_id uuid, product_id uuid references products,
  description text not null, amount_cents int not null check(amount_cents>0),
  due_date date not null, status text not null default 'pending' check(status in('pending','paid','canceled')),
  paid_at timestamptz, cancel_at date, mp_payment_id text, pix_code text, pix_qr text, pix_at timestamptz,
  created_at timestamptz default now());
alter table products enable row level security;   -- sem policy: só o servidor (admin) acessa
alter table invoices enable row level security;
create policy "ver minhas faturas" on invoices for select to authenticated using (user_id = auth.uid());
-- o cliente só LÊ. Criar, pagar e cancelar passam pelo servidor (/api).

-- ===== BLOG =====
create table posts(id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, description text not null, cover_url text, author_name text not null, author_photo text, created_at timestamptz default now());
alter table posts enable row level security;
create policy "blog publico" on posts for select to anon, authenticated using (true);
insert into storage.buckets (id, name, public) values ('blog','blog',true) on conflict do nothing;  -- imagens públicas do blog
