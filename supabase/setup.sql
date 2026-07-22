-- SHYIRA Sweet FINAL secure admin + inquiries + products + gallery + settings
-- Safe to run more than once. Designed to upgrade either the original schema or earlier admin attempts.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Admin allow-list ----------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Owner',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admin users can read own authorization" on public.admin_users;
drop policy if exists "Admin can read own admin row" on public.admin_users;
create policy "Admin can read own admin row"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

grant select on public.admin_users to authenticated;

-- ---------- Inquiries ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  status text not null default 'new',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inquiries add column if not exists source text not null default 'website';
alter table public.inquiries add column if not exists updated_at timestamptz not null default now();

-- Remove any older status CHECK constraint first, then normalize values to lowercase.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.inquiries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.inquiries drop constraint if exists %I', c.conname);
  end loop;
end $$;

alter table public.inquiries alter column status drop default;
update public.inquiries
set status = case lower(status)
  when 'contacted' then 'contacted'
  when 'completed' then 'completed'
  else 'new'
end;
alter table public.inquiries alter column status set default 'new';
alter table public.inquiries
  add constraint inquiries_status_check check (status in ('new', 'contacted', 'completed'));

alter table public.inquiries enable row level security;

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

-- Public visitors may INSERT only. They can never read inquiries.
drop policy if exists "Public can submit inquiries" on public.inquiries;
create policy "Public can submit inquiries"
on public.inquiries for insert
to anon, authenticated
with check (
  char_length(name) between 1 and 120
  and char_length(contact) between 1 and 200
  and char_length(message) between 1 and 5000
  and status = 'new'
);

drop policy if exists "admins can read inquiries" on public.inquiries;
drop policy if exists "Admins can read inquiries" on public.inquiries;
create policy "Admins can read inquiries"
on public.inquiries for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can update inquiries" on public.inquiries;
drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries"
on public.inquiries for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete inquiries" on public.inquiries;
drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries"
on public.inquiries for delete
to authenticated
using (public.is_admin());

grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

-- ---------- Products / menu ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price text not null,
  unit text not null default '',
  image_url text not null,
  alt_text text not null default '',
  tag text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon
using (active = true);

drop policy if exists "Authenticated can read active products" on public.products;
create policy "Authenticated can read active products"
on public.products for select
to authenticated
using (active = true);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using (public.is_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

insert into public.products (name, description, price, unit, image_url, alt_text, tag, active, sort_order)
select * from (
  values
    ('Kunafa Cheese','Freshly baked cheese kunafa — golden, crispy, and stretchy. Prepared for the perfect cheese pull, crowned with crushed pistachios.','$50 / $25','Large / Small','https://images.pexels.com/photos/36691305/pexels-photo-36691305.jpeg?auto=compress&cs=tinysrgb&w=1600','Traditional kunafa dessert garnished with crushed pistachios and mint on a decorative plate','Signature',true,10),
    ('Halawa Al-Jubn','Traditional cheese halawa — soft, sweet, and delicately layered with cheese and ashta cream. A Syrian classic.','$60 / $30','Large / Small','https://images.pexels.com/photos/16557600/pexels-photo-16557600.jpeg?auto=compress&cs=tinysrgb&w=1600','Halawa al-jubn cheese dessert with pistachio topping',null,true,20),
    ('Madlouqa','Crispy layered pastry soaked in fragrant syrup, filled with ashta cream and topped with pistachios. Light, flaky, and deeply satisfying.','$40 / $80','Small / Large','https://images.pexels.com/photos/20183050/pexels-photo-20183050.jpeg?auto=compress&cs=tinysrgb&w=1600','Madlouqa layered pastry dessert, golden with crushed nuts',null,true,30),
    ('Baklava','Classic Syrian baklava with layers of paper-thin phyllo, clarified butter, and Aleppo pistachios. Finished with aromatic syrup.','$40 / $20','Large / Small','https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&w=1600','Traditional baklava sprinkled with crushed pistachios','Best seller',true,40)
) as seed(name, description, price, unit, image_url, alt_text, tag, active, sort_order)
where not exists (select 1 from public.products limit 1);

-- ---------- Gallery / portfolio ----------
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Work',
  description text not null default '',
  image_url text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

drop trigger if exists portfolio_items_set_updated_at on public.portfolio_items;
create trigger portfolio_items_set_updated_at
before update on public.portfolio_items
for each row execute function public.set_updated_at();

drop policy if exists "public can read visible portfolio" on public.portfolio_items;
create policy "Public can read visible portfolio"
on public.portfolio_items for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert portfolio" on public.portfolio_items;
create policy "Admins can insert portfolio"
on public.portfolio_items for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can update portfolio" on public.portfolio_items;
create policy "Admins can update portfolio"
on public.portfolio_items for update
to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can delete portfolio" on public.portfolio_items;
create policy "Admins can delete portfolio"
on public.portfolio_items for delete
to authenticated
using (public.is_admin());

grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;

insert into public.portfolio_items (title, category, image_url, sort_order)
select * from (values
  ('Awameh', 'Sweets', '/images/awameh.jpg', 10),
  ('Barazek', 'Sweets', '/images/barazek.jpg', 20),
  ('Maamoul', 'Sweets', '/images/maamoul.jpg', 30),
  ('From Our Kitchen', 'Behind the Scenes', '/images/chef.jpg', 40)
) as seed(title, category, image_url, sort_order)
where not exists (select 1 from public.portfolio_items limit 1);

-- ---------- Site settings ----------
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  phone_display text not null default '+1 734-629-3442',
  phone_link text not null default '17346293442',
  whatsapp_link text not null default '17346293442',
  instagram_url text not null default 'https://www.instagram.com/shyira.sweet/',
  instagram_handle text not null default '@shyira.sweet',
  facebook_url text not null default 'https://www.facebook.com/profile.php?id=100054819966994',
  city text not null default 'Michigan, USA',
  footer_tagline text not null default 'Handmade from our home to your table — the taste of Syria.',
  footer_rights_text text not null default 'SHYIRA Sweet. All rights reserved.',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;

drop policy if exists "public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings for update
to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- ---------- Storage: product images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- ---------- Storage: gallery images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio','portfolio',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins can upload portfolio images" on storage.objects;
create policy "Admins can upload portfolio images"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admins can update portfolio images" on storage.objects;
create policy "Admins can update portfolio images"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio' and public.is_admin())
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admins can delete portfolio images" on storage.objects;
create policy "Admins can delete portfolio images"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio' and public.is_admin());

-- ---------- IMPORTANT: authorize your existing Supabase Auth user ----------
-- Run ONE statement after this setup, replacing the UUID:
-- insert into public.admin_users (user_id, display_name)
-- values ('YOUR-USER-UUID', 'Owner')
-- on conflict (user_id) do nothing;

-- Verification query:
select au.user_id, au.display_name, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id;
