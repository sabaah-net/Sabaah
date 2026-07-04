-- Migration: add current_subscription_id column to profiles
alter table public.profiles
add column if not exists current_subscription_id uuid references public.user_subscriptions(id) on delete set null;
