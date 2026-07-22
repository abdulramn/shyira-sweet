-- SHYIRA Sweet: real admin dashboard database setup
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

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

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- Optional starter portfolio entries using images already in the website repository.
insert into public.portfolio_items (title, category, image_url, sort_order)
select * from (values
  ('Awameh', 'Sweets', '/images/awameh.jpg', 10),
  ('Barazek', 'Sweets', '/images/barazek.jpg', 20),
  ('Maamoul', 'Sweets', '/images/maamoul.jpg', 30),
  ('From Our Kitchen', 'Behind the Scenes', '/images/chef.jpg', 40)
) as seed(title, category, image_url, sort_order)
where not exists (select 1 from public.portfolio_items);

alter table public.admin_users enable row level security;
alter table public.inquiries enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.site_settings enable row level security;

-- Admin bootstrap table: signed-in users may only see whether their own ID is authorized.
drop policy if exists "admin users can read own authorization" on public.admin_users;
create policy "admin users can read own authorization"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- Inquiries are private. Public website inserts through the Netlify Function using the server secret.
drop policy if exists "admins can read inquiries" on public.inquiries;
create policy "admins can read inquiries"
on public.inquiries for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can update inquiries" on public.inquiries;
create policy "admins can update inquiries"
on public.inquiries for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete inquiries" on public.inquiries;
create policy "admins can delete inquiries"
on public.inquiries for delete
to authenticated
using (public.is_admin());

-- Portfolio is publicly readable only when visible. Admins can manage all entries.
drop policy if exists "public can view visible portfolio" on public.portfolio_items;
create policy "public can view visible portfolio"
on public.portfolio_items for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "admins can insert portfolio" on public.portfolio_items;
create policy "admins can insert portfolio"
on public.portfolio_items for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can update portfolio" on public.portfolio_items;
create policy "admins can update portfolio"
on public.portfolio_items for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete portfolio" on public.portfolio_items;
create policy "admins can delete portfolio"
on public.portfolio_items for delete
to authenticated
using (public.is_admin());

-- Public site can read contact/footer settings; only admins can change them.
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "admins can update site settings" on public.site_settings;
create policy "admins can update site settings"
on public.site_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Public image bucket for portfolio images. Upload/delete remains admin-only.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "admins can upload portfolio images" on storage.objects;
create policy "admins can upload portfolio images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admins can update portfolio images" on storage.objects;
create policy "admins can update portfolio images"
on storage.objects for update
to authenticated
using (bucket_id = 'portfolio' and public.is_admin())
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "admins can delete portfolio images" on storage.objects;
create policy "admins can delete portfolio images"
on storage.objects for delete
to authenticated
using (bucket_id = 'portfolio' and public.is_admin());

-- After creating your owner user in Supabase Authentication, run ONE line like this
-- using the user's UUID shown in Authentication > Users:
-- insert into public.admin_users (user_id) values ('YOUR-USER-UUID');

-- Explicit API grants. Row Level Security policies above still decide which rows are accessible.
grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant select on public.admin_users to authenticated;
grant select, update, delete on public.inquiries to authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;
grant update on public.site_settings to authenticated;
