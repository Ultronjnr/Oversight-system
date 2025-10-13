-- Enable required extensions
create extension if not exists pgcrypto;

-- Users table mirrors auth.users with additional app fields
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('Employee','HOD','Finance','Admin','SuperUser')),
  name text not null,
  department text,
  permissions text[] not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Invitations table for Super Admin panel
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('Employee','HOD','Finance','Admin','SuperUser')),
  department text,
  message text,
  token text not null unique,
  status text not null check (status in ('pending','accepted','revoked','expired')) default 'pending',
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

create index if not exists invitations_token_idx on public.invitations(token);
create index if not exists invitations_email_idx on public.invitations(email);

-- RLS
alter table public.users enable row level security;
alter table public.invitations enable row level security;

-- Users policies
-- Allow users to read their own profile
create policy if not exists users_select_own on public.users
for select
using (auth.uid() = id);

-- Allow users to insert their own profile row (covers immediate-session signups)
create policy if not exists users_insert_self on public.users
for insert
with check (auth.uid() = id);

-- Allow users to update their own profile
create policy if not exists users_update_own on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Invitations policies
-- Allow authenticated users to read invitations (Super Admin UI can filter in app)
create policy if not exists invitations_select_auth on public.invitations
for select
using (auth.role() = 'authenticated');

-- Allow authenticated users to create invitations
create policy if not exists invitations_insert_auth on public.invitations
for insert
with check (auth.role() = 'authenticated');

-- Allow authenticated users to update invitations
create policy if not exists invitations_update_auth on public.invitations
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Triggers
-- Keep users.updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- On auth user creation, seed public.users from metadata
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, name, department, permissions)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'role',''), 'Employee'),
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'department',''),
    coalesce(string_to_array(coalesce(new.raw_user_meta_data->>'permissions',''), ','), '{}')
  )
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
