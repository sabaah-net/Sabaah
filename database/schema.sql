-- ============================================================
-- سبعة ٧ | Sabaa Coffee Operations Platform
-- Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. USERS & AUTH
-- ============================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid,
  password text,
  phone text,
  email text,
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('male', 'female', null)),
  city text default 'riyadh',
  role text not null default 'Customer' check (role in ('Customer', 'Partner', 'Admin', 'Operations Admin', 'Finance Admin', 'Super Admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  wallet_balance numeric(12,2) not null default 0.00,
  loyalty_points integer not null default 0,
  loyalty_tier text not null default 'bronze' check (loyalty_tier in ('bronze', 'silver', 'gold', 'platinum')),
  streak integer not null default 0,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lang text not null default 'ar',
  theme text not null default 'light',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. CAFES / PARTNERS
-- ============================================================
create table public.cafes (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete set null,
  name_ar text not null,
  name_en text not null,
  description text,
  location text not null,
  city text not null default 'riyadh',
  lat numeric(10,7),
  lng numeric(10,7),
  phone text,
  email text,
  emoji text default '☕',
  rating numeric(3,1) default 0.0 check (rating >= 0 and rating <= 5),
  is_open boolean not null default true,
  commission_rate numeric(5,2) not null default 35.00,
  inventory_enabled boolean not null default true,
  total_favorites integer not null default 0,
  total_orders integer not null default 0,
  avg_wait_min integer not null default 5,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. MENU / ITEMS
-- ============================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  cafe_id uuid references public.cafes(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  icon text default '🏷️',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  cafe_id uuid references public.cafes(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name_ar text not null,
  name_en text,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  vat_rate numeric(5,2) not null default 15.00,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_featured boolean not null default false,
  is_spicy boolean not null default false,
  is_vegan boolean not null default false,
  icon text default '☕',
  sales_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- computed column: total price = base_price * (1 + vat_rate/100)
create or replace function public.menu_item_total_price(item_id uuid)
returns numeric as $$
  select base_price * (1 + vat_rate / 100) from public.menu_items where id = item_id;
$$ language sql stable;

-- ============================================================
-- 4. ORDERS
-- ============================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id),
  status text not null default 'pending' check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  pickup_code text not null,
  pickup_time timestamptz,
  subtotal numeric(12,2) not null,
  vat_amount numeric(12,2) not null,
  platform_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  payment_method text not null check (payment_method in ('wallet', 'card', 'apple')),
  is_paid boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name_ar text not null,
  item_name_en text,
  icon text default '☕',
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. WALLET TRANSACTIONS
-- ============================================================
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(12,2) not null check (amount > 0),
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  description_ar text,
  description_en text,
  reference text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. LOYALTY & REWARDS
-- ============================================================
create table public.rewards (
  id uuid primary key default uuid_generate_v4(),
  icon text default '🎁',
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  points_cost integer not null check (points_cost > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  points_spent integer not null,
  redeemed_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  badge_key text not null unique,
  icon text not null,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  criteria text,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- ============================================================
-- 7. SUBSCRIPTIONS
-- ============================================================
create table public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  price_weekly numeric(10,2) not null,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  start_date date not null default current_date,
  end_date date,
  days_of_week jsonb not null default '["monday","tuesday","wednesday","thursday","friday"]',
  auto_renew boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. GROUP ORDERS
-- ============================================================
create table public.group_orders (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null references public.profiles(id),
  name text,
  invite_code text not null unique,
  cafe_id uuid references public.cafes(id),
  status text not null default 'open' check (status in ('open', 'closed', 'submitted')),
  created_at timestamptz not null default now()
);

create table public.group_order_items (
  id uuid primary key default uuid_generate_v4(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  menu_item_id uuid references public.menu_items(id),
  item_name_ar text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. INVENTORY
-- ============================================================
create table public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name_ar text not null,
  name_en text,
  unit text not null default 'قطعة',
  current_level numeric(10,2) not null default 0,
  min_level numeric(10,2) not null default 10,
  max_level numeric(10,2) not null default 100,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 10. STAFF / EMPLOYEES
-- ============================================================
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  name text not null,
  role text not null,
  shift text not null check (shift in ('صباحي', 'مسائي', 'يوم كامل')),
  phone text,
  status text not null default 'active' check (status in ('active', 'off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 11. PROMOTIONS
-- ============================================================
create table public.promotions (
  id uuid primary key default uuid_generate_v4(),
  cafe_id uuid references public.cafes(id) on delete cascade,
  name_ar text not null,
  name_en text,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  start_time time not null,
  end_time time not null,
  days_of_week jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  title_ar text not null,
  title_en text,
  body_ar text not null,
  body_en text,
  icon text default '🔔',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  is_read boolean not null default false,
  is_push boolean not null default false,
  campaign_id uuid,
  created_at timestamptz not null default now()
);

create table public.notification_campaigns (
  id uuid primary key default uuid_generate_v4(),
  title_ar text not null,
  title_b_ar text,
  body_ar text not null,
  channel text not null check (channel in ('push', 'sms', 'email', 'whatsapp')),
  segment_filters jsonb default '{}',
  estimated_reach integer default 0,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent')),
  created_by uuid references public.profiles(id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 13. AUDIT LOG
-- ============================================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  action_ar text not null,
  action_type text not null check (action_type in ('login', 'order', 'user', 'partner', 'menu', 'staff', 'finance', 'inventory', 'notification', 'system', 'reward')),
  details text,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 14. FAVORITES
-- ============================================================
create table public.user_favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, cafe_id)
);

-- ============================================================
-- 15. SYSTEM SETTINGS
-- ============================================================
create table public.system_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value, description) values
  ('vat_rate', '15', 'نسبة ضريبة القيمة المضافة'),
  ('platform_commission', '35', 'عمولة المنصة %'),
  ('payment_fee', '2.5', 'عمولة الدفع الإلكتروني %');

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_cafe on public.orders(cafe_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);
create index idx_transactions_user on public.transactions(user_id);
create index idx_menu_items_cafe on public.menu_items(cafe_id);
create index idx_menu_items_category on public.menu_items(category_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;
create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_inventory_cafe on public.inventory_items(cafe_id);
create index idx_employees_cafe on public.employees(cafe_id);
create index idx_promotions_cafe on public.promotions(cafe_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_profiles_phone on public.profiles(phone);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.transactions enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = auth_id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = auth_id);

-- Cafes: public read, partners/super admin can manage
create policy "Anyone can view active cafes"
  on public.cafes for select using (status = 'active');

create policy "Partners can manage their own cafe"
  on public.cafes for all using (owner_id = auth.uid());

-- Menu items: public read
create policy "Anyone can view active menu items"
  on public.menu_items for select using (status = 'active');

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_timestamp before update on public.profiles
  for each row execute function public.update_timestamp();

create trigger update_cafes_timestamp before update on public.cafes
  for each row execute function public.update_timestamp();

create trigger update_menu_items_timestamp before update on public.menu_items
  for each row execute function public.update_timestamp();

create trigger update_orders_timestamp before update on public.orders
  for each row execute function public.update_timestamp();

-- Auto-generate order number
create sequence public.order_number_seq start 1000;

create or replace function public.generate_order_number()
returns text as $$
  select 'SB-' || nextval('public.order_number_seq');
$$ language sql;

-- Generate pickup code
create or replace function public.generate_pickup_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..4 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Update wallet balance on transaction
create or replace function public.update_wallet_balance()
returns trigger as $$
begin
  if new.type = 'credit' then
    update public.profiles set wallet_balance = wallet_balance + new.amount
    where id = new.user_id;
  elsif new.type = 'debit' then
    update public.profiles set wallet_balance = wallet_balance - new.amount
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger after_transaction_insert
  after insert on public.transactions
  for each row execute function public.update_wallet_balance();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed Badges
insert into public.badges (badge_key, icon, name_ar, name_en, description_ar, description_en) values
  ('first', '🎯', 'القهوة الأولى', 'First Coffee', 'أكمل طلبك الأول', 'Complete your first order'),
  ('streak7', '🔥', 'أسبوع كامل', 'Full Week', '7 أيام متتالية', '7 days streak'),
  ('explorer', '🗺️', 'المكتشف', 'Explorer', 'جرب 5 مقاهي مختلفة', 'Try 5 different cafes'),
  ('vip', '👑', 'VIP', 'VIP', 'وصل إلى 5000 نقطة', 'Reach 5000 points'),
  ('group', '👥', 'منسق المجموعة', 'Group Host', 'أنشئ طلب جماعي', 'Create a group order'),
  ('night', '🌙', 'سهران', 'Night Owl', 'اطلب بعد منتصف الليل', 'Order after midnight'),
  ('voice', '🎙️', 'صوتي', 'Voice', 'استخدم الطلب الصوتي', 'Use voice order'),
  ('sub', '📅', 'مشترك دائم', 'Subscriber', 'فعل اشتراك أسبوعي', 'Activate weekly subscription');

-- Seed Rewards
insert into public.rewards (icon, title_ar, title_en, description_ar, description_en, points_cost) values
  ('☕', 'قهوة مجانية', 'Free Coffee', 'أي نوع قهوة في أي مقهى', 'Any coffee at any cafe', 100),
  ('🥐', 'كرواسان مجاني', 'Free Croissant', 'مع أي طلب قهوة', 'With any coffee order', 50),
  ('💰', 'خصم 50%', '50% Discount', 'على الطلب التالي', 'On your next order', 200),
  ('📅', 'أسبوع مجاني', 'Free Week', 'اشتراك الباس لأسبوع', 'Weekly subscription for a week', 500);

-- Seed Subscription Plans
insert into public.subscription_plans (name_ar, name_en, description_ar, description_en, price_weekly, features) values
  ('☕ الباس اليومي', 'Daily Pass', 'قهوة سوداء واحدة يومياً في أي مقهى شريك', 'One black coffee daily at any partner cafe', 49, '["7 قهوات", "توصيل مجاني", "أولوية التحضير"]'),
  ('🥛 محبي الحليب', 'Milk Lovers', 'قهوة بيضاء أو موكا يومياً', 'White coffee or mocha daily', 69, '["7 مشروبات", "حليب نباتي مجاني"]'),
  ('💎 البلاتينيوم', 'Platinum', 'أي نوع قهوة بلا حدود + حلويات', 'Unlimited coffee + pastries', 99, '["غير محدود", "حلوى مجانية يومياً", "دعم VIP"]');
