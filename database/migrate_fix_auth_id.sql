-- تشغيل هذا في Supabase SQL Editor
-- Fix: إزالة FK constraint + unique من auth_id، إضافة password column

alter table public.profiles
  alter column auth_id drop not null,
  alter column auth_id drop default,
  alter column phone drop not null;

-- إزالة unique constraint من auth_id (إن وُجد)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'profiles_auth_id_key'
  ) then
    alter table public.profiles drop constraint profiles_auth_id_key;
  end if;
end $$;

-- إزالة foreign key constraint (إن وُجد)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'profiles_auth_id_fkey'
  ) then
    alter table public.profiles drop constraint profiles_auth_id_fkey;
  end if;
end $$;

-- إضافة password column (إن لم يوجد)
alter table public.profiles add column if not exists password text;

-- تعطيل RLS للتطوير مؤقتاً
alter table public.profiles disable row level security;
alter table public.cafes disable row level security;
alter table public.menu_items disable row level security;
