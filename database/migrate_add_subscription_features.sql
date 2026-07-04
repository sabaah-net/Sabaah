-- Add real functionality columns to subscription_plans
alter table public.subscription_plans
add column if not exists discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100);

alter table public.subscription_plans
add column if not exists free_delivery boolean not null default false;

-- Update seed plans with realistic data
update public.subscription_plans set
  discount_percent = 10, free_delivery = false,
  features = '["7 قهوات", "توصيل مجاني", "أولوية التحضير", "خصم 10%", "نقاط مضاعفة"]'
where name_ar = '☕ الباس اليومي' or name_ar like 'الباس%';

update public.subscription_plans set
  discount_percent = 15, free_delivery = false,
  features = '["7 مشروبات", "حليب نباتي مجاني", "خصم 15%", "نقاط مضاعفة"]'
where name_ar = '🥛 محبي الحليب' or name_ar like 'محبي%';

update public.subscription_plans set
  discount_percent = 25, free_delivery = true,
  features = '["غير محدود", "حلوى مجانية يومياً", "دعم VIP", "خصم 25%", "توصيل مجاني"]'
where name_ar = '💎 البلاتينيوم' or name_ar like 'البلاتينيوم%';

-- Insert fallback plans if none exist
insert into public.subscription_plans (name_ar, name_en, description_ar, description_en, price_weekly, discount_percent, free_delivery, features)
select '☕ الباس اليومي', 'Daily Pass', 'قهوة سوداء واحدة يومياً في أي مقهى شريك', 'One black coffee daily at any partner cafe', 49, 10, false, '["7 قهوات", "توصيل مجاني", "أولوية التحضير", "خصم 10%"]'
where not exists (select 1 from public.subscription_plans);

insert into public.subscription_plans (name_ar, name_en, description_ar, description_en, price_weekly, discount_percent, free_delivery, features)
select '🥛 محبي الحليب', 'Milk Lovers', 'قهوة بيضاء أو موكا يومياً', 'White coffee or mocha daily', 69, 15, false, '["7 مشروبات", "حليب نباتي مجاني", "خصم 15%"]'
where not exists (select 1 from public.subscription_plans where name_ar like 'محبي%');

insert into public.subscription_plans (name_ar, name_en, description_ar, description_en, price_weekly, discount_percent, free_delivery, features)
select '💎 البلاتينيوم', 'Platinum', 'أي نوع قهوة بلا حدود + حلويات', 'Unlimited coffee + pastries', 99, 25, true, '["غير محدود", "حلوى مجانية يومياً", "دعم VIP", "خصم 25%", "توصيل مجاني"]'
where not exists (select 1 from public.subscription_plans where name_ar like 'البلاتينيوم%');
