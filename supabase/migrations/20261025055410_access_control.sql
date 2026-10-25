-- Access control: roles, profiles, role helpers, access token hook.
-- PRD UMM-01, UMM-02, MST-01 (change: setup-access-control).

-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at current (reused by later tables)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles and profiles
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'super_admin',
  'director',
  'marketing',
  'finance',
  'hcm',
  'operations',
  'field'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null unique,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per app user: role and active status (PRD §6, MST-01). No profile means no access.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers used by every RLS policy. They read the profile (not the JWT)
-- so deactivation and role changes apply immediately.
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = any (roles), false)
$$;

-- ---------------------------------------------------------------------------
-- Custom access token hook: adds user_role and is_active claims (PRD §15).
-- Claims are display hints for browser code; authorization uses the profile.
-- ---------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := event -> 'claims';
  user_profile record;
begin
  select p.role, p.is_active
  into user_profile
  from public.profiles p
  where p.id = (event ->> 'user_id')::uuid;

  if found then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_profile.role));
    claims := jsonb_set(claims, '{is_active}', to_jsonb(user_profile.is_active));
  else
    claims := jsonb_set(claims, '{user_role}', 'null'::jsonb);
    claims := jsonb_set(claims, '{is_active}', 'false'::jsonb);
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table public.profiles to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Guards: never leave zero active Super Admins; no self-deactivation.
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_active and not new.is_active and old.id = auth.uid() then
    raise exception 'Tidak dapat menonaktifkan akun sendiri';
  end if;

  if old.role = 'super_admin'
     and old.is_active
     and (new.role <> 'super_admin' or not new.is_active)
     and not exists (
       select 1
       from public.profiles p
       where p.role = 'super_admin'
         and p.is_active
         and p.id <> old.id
     ) then
    raise exception 'Minimal harus ada satu Super Admin aktif';
  end if;

  return new;
end;
$$;

create trigger profiles_guard
before update on public.profiles
for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- User list for Super Admin and Direktur (needs auth.users fields).
-- status: 'active' | 'invited' (invite not accepted yet) | 'inactive'
-- ---------------------------------------------------------------------------
create or replace function public.list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.app_role,
  is_active boolean,
  status text,
  last_sign_in_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('super_admin', 'director') then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.is_active,
    case
      when not p.is_active then 'inactive'
      when u.email_confirmed_at is null then 'invited'
      else 'active'
    end,
    u.last_sign_in_at,
    u.invited_at,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.full_name;
end;
$$;

revoke execute on function public.list_users() from anon, public;
grant execute on function public.list_users() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant update (full_name, role, is_active) on table public.profiles to authenticated;

create policy "Auth admin reads profiles for the token hook"
on public.profiles
for select
to supabase_auth_admin
using (true);

create policy "Users read their own profile; Super Admin and Direktur read all"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.has_role('super_admin', 'director'))
);

create policy "Super Admin updates profiles"
on public.profiles
for update
to authenticated
using ((select public.has_role('super_admin')))
with check ((select public.has_role('super_admin')));
