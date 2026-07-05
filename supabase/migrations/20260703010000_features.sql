-- Permissions table: Add/View/Update per resource
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource text not null,
  can_add boolean not null default false,
  can_view boolean not null default false,
  can_update boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, resource)
);

-- Add logo_url and points_per_item to cafes
alter table public.cafes add column if not exists logo_url text;
alter table public.cafes add column if not exists points_per_item integer not null default 10;

-- Add loyalty_points field in admin user edit was always there, but add column for partner menu items
alter table public.menu_items add column if not exists points_per_item integer not null default 10;

-- Add days_of_week, start_date to subscription_plans for the calendar
alter table public.subscription_plans add column if not exists days_of_week jsonb not null default '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb;
alter table public.subscription_plans add column if not exists max_bookings integer not null default 30;
