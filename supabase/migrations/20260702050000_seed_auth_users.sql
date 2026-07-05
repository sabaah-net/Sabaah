-- Create auth users for existing seed profiles
-- Run this in Supabase SQL Editor (requires superuser access to auth schema)
-- Credentials: admin@sabaa.com / Admin123!  and  ahmed@brew92.com / Brew92123!

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- Admin: Khaled Mohammed (Super Admin)
-- ============================================================
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token, is_sso_user, is_anonymous)
select
  'a0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'admin@sabaa.com',
   extensions.crypt('Admin123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Khaled","last_name":"Mohammed"}',
  now(), now(), '', '', '', '', false, false
where not exists (select 1 from auth.users where email = 'admin@sabaa.com');

-- Insert identity for admin
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000006',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000006', 'email', 'admin@sabaa.com'),
  'email',
  'admin@sabaa.com',
  now(), now(), now()
where not exists (select 1 from auth.identities where provider_id = 'admin@sabaa.com');

-- ============================================================
-- Partner: Ahmed Fahd (owns Brew92 cafe)
-- ============================================================
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token, is_sso_user, is_anonymous)
select
  'a0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'ahmed@brew92.com',
   extensions.crypt('Brew92123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Ahmed","last_name":"Fahd"}',
  now(), now(), '', '', '', '', false, false
where not exists (select 1 from auth.users where email = 'ahmed@brew92.com');

-- Insert identity for partner
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000004', 'email', 'ahmed@brew92.com'),
  'email',
  'ahmed@brew92.com',
  now(), now(), now()
where not exists (select 1 from auth.identities where provider_id = 'ahmed@brew92.com');

-- Ensure Brew92 owner_id is set correctly
update public.cafes set owner_id = 'a0000000-0000-0000-0000-000000000004'
where id = 'b0000000-0000-0000-0000-000000000001' and (owner_id is null or owner_id != 'a0000000-0000-0000-0000-000000000004');
