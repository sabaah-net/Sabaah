-- Add partner_role and sabaa_role columns to profiles
alter table public.profiles
  add column if not exists partner_role text,
  add column if not exists sabaa_role text;

-- Allow 'Sabaa' role in constraint
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('Customer', 'Partner', 'Sabaa', 'Admin', 'Operations Admin', 'Finance Admin', 'Super Admin'));

-- Allow 'banned' and 'pending' in status
alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'suspended', 'banned', 'pending'));
