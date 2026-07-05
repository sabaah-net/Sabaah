import { supabase } from './supabase';
import type { StaffMember, Promo } from '../types';

// ============================================================
// PERMISSIONS
// ============================================================
export const PERMISSION_RESOURCES = [
  'edit_cafes', 'edit_users', 'edit_prices', 'edit_menus',
  'edit_orders', 'edit_promotions', 'edit_subscriptions',
  'view_reports', 'view_analytics', 'manage_staff',
];

export interface Permission {
  id: string;
  user_id: string;
  resource: string;
  can_add: boolean;
  can_view: boolean;
  can_update: boolean;
}

export async function getUserPermissions(userId: string) {
  return supabase.from('user_permissions').select('*').eq('user_id', userId);
}

export async function getAllPermissions() {
  return supabase.from('user_permissions').select('*, profiles!inner(first_name, last_name, email)');
}

export async function upsertPermission(userId: string, resource: string, data: { can_add?: boolean; can_view?: boolean; can_update?: boolean }) {
  const existing = await supabase.from('user_permissions').select('id').eq('user_id', userId).eq('resource', resource).maybeSingle();
  if (existing.data) {
    return supabase.from('user_permissions').update(data).eq('id', existing.data.id);
  }
  return supabase.from('user_permissions').insert({
    user_id: userId, resource,
    can_add: data.can_add || false,
    can_view: data.can_view || false,
    can_update: data.can_update || false,
  });
}

export async function deletePermission(id: string) {
  return supabase.from('user_permissions').delete().eq('id', id);
}

// ============================================================
// CAFE ASSIGNMENT
// ============================================================
export async function assignCafeOwner(cafeId: string, ownerId: string | null) {
  return supabase.from('cafes').update({ owner_id: ownerId }).eq('id', cafeId);
}

export async function getCafesByOwner(ownerId: string) {
  return supabase.from('cafes').select('*').eq('owner_id', ownerId);
}

export async function getAvailableOwners() {
  return supabase.from('profiles').select('id, first_name, last_name, email').eq('role', 'Partner').in('status', ['active', 'pending']);
}

// ============================================================
// LOGO UPLOAD (SVG/PNG/JPEG/JPG/PDF, max 3MB)
// ============================================================
const MAX_LOGO_SIZE = 3 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

export async function uploadCafeLogo(cafeId: string, file: File): Promise<string> {
  if (file.size > MAX_LOGO_SIZE) throw new Error('File too large. Max 3MB.');
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) throw new Error('Invalid file type. Allowed: SVG, PNG, JPEG, JPG, PDF.');

  const ext = file.name.split('.').pop() || 'png';
  const path = `cafe_logos/${cafeId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('partner_docs').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('partner_docs').getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || '';

  await supabase.from('cafes').update({ logo_url: publicUrl }).eq('id', cafeId);
  return publicUrl;
}

export async function deleteCafeLogo(cafeId: string) {
  const { data: cafe } = await supabase.from('cafes').select('logo_url').eq('id', cafeId).single();
  if (cafe?.logo_url) {
    const path = cafe.logo_url.split('/partner_docs/')[1];
    if (path) supabase.storage.from('partner_docs').remove([path]).catch(() => {});
  }
  return supabase.from('cafes').update({ logo_url: null }).eq('id', cafeId);
}

// ============================================================
// STAFF MANAGEMENT (DB-linked, per cafe)
// ============================================================
export interface StaffRow {
  id: string;
  cafe_id: string;
  name: string;
  role: string;
  shift: string;
  phone?: string;
  status: string;
}

export async function getStaff(cafeId: string) {
  return supabase.from('employees').select('*').eq('cafe_id', cafeId).order('created_at', { ascending: false });
}

export async function addStaffMember(cafeId: string, data: { name: string; role: string; shift: string; phone?: string }) {
  return supabase.from('employees').insert({
    cafe_id: cafeId,
    name: data.name,
    role: data.role,
    shift: data.shift,
    phone: data.phone || null,
    status: 'active',
  }).select().single();
}

export async function updateStaffMember(id: string, data: { name?: string; role?: string; shift?: string; status?: string }) {
  return supabase.from('employees').update(data).eq('id', id);
}

export async function deleteStaffMember(id: string) {
  return supabase.from('employees').delete().eq('id', id);
}

// ============================================================
// PROMOTIONS (DB-linked, per cafe)
// ============================================================
export interface PromotionRow {
  id: string;
  cafe_id: string;
  name_ar: string;
  name_en?: string;
  discount_percent: number;
  start_time: string;
  end_time: string;
  days_of_week?: string[];
  is_active: boolean;
}

export async function getPromotionsForCafe(cafeId: string) {
  return supabase.from('promotions').select('*').eq('cafe_id', cafeId).order('created_at', { ascending: false });
}

export async function createPromotion(cafeId: string, data: {
  name_ar: string; name_en?: string; discount_percent: number;
  start_time: string; end_time: string; days_of_week?: string[];
}) {
  return supabase.from('promotions').insert({
    cafe_id: cafeId,
    name_ar: data.name_ar,
    name_en: data.name_en || data.name_ar,
    discount_percent: data.discount_percent,
    start_time: data.start_time,
    end_time: data.end_time,
    days_of_week: data.days_of_week ? JSON.stringify(data.days_of_week) : null,
    is_active: true,
  }).select().single();
}

export async function togglePromotion(id: string, isActive: boolean) {
  return supabase.from('promotions').update({ is_active: isActive }).eq('id', id);
}

export async function deletePromotion(id: string) {
  return supabase.from('promotions').delete().eq('id', id);
}

// ============================================================
// POINTS PER ITEM (partner config)
// ============================================================
export async function getCafeSettings(cafeId: string) {
  return supabase.from('cafes').select('id, name_ar, points_per_item, logo_url, is_open, avg_wait_min').eq('id', cafeId).single();
}

export async function updateCafePointsPerItem(cafeId: string, points: number) {
  return supabase.from('cafes').update({ points_per_item: points }).eq('id', cafeId);
}

// ============================================================
// SUBSCRIPTIONS with calendar
// ============================================================
export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const WEEK_DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const WEEK_DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function subscribeUserWithCalendar(userId: string, planId: string, startDate: string, daysOfWeek: string[], price: number) {
  const { data: plan } = await supabase.from('subscription_plans').select('price_weekly, name_ar, name_en').eq('id', planId).single();
  if (!plan) return { data: null, error: new Error('Plan not found') };

  const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
  if (!profile || Number(profile.wallet_balance) < price) {
    return { data: null, error: new Error('Insufficient balance') };
  }

  const newBalance = Number(profile.wallet_balance) - price;

  const { data: existing } = await supabase.from('user_subscriptions')
    .select('id').eq('user_id', userId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('user_subscriptions').update({
      plan_id: planId, start_date: startDate, days_of_week: JSON.stringify(daysOfWeek), status: 'active',
    }).eq('id', existing.id);
    if (error) return { data: null, error };
    await supabase.from('profiles').update({ wallet_balance: newBalance, current_subscription_id: existing.id }).eq('id', userId);
  } else {
    const { data, error } = await supabase.from('user_subscriptions').insert({
      user_id: userId, plan_id: planId, start_date: startDate,
      days_of_week: JSON.stringify(daysOfWeek), status: 'active',
    }).select().single();
    if (error || !data) return { data: null, error };
    await supabase.from('profiles').update({ wallet_balance: newBalance, current_subscription_id: data.id }).eq('id', userId);
  }

  supabase.from('transactions').insert({
    user_id: userId, type: 'debit', amount: price,
    balance_before: Number(profile.wallet_balance), balance_after: newBalance,
    description_ar: `اشتراك: ${plan.name_ar}`,
    description_en: `Subscription: ${plan.name_en || plan.name_ar}`,
  }).then(() => {});

  return { data: { new_balance: newBalance }, error: null };
}

// ============================================================
// ADMIN: update balance + points
// ============================================================
export async function updateUserWalletAndPoints(userId: string, walletBalance: number, loyaltyPoints: number) {
  return supabase.from('profiles').update({
    wallet_balance: walletBalance,
    loyalty_points: loyaltyPoints,
  }).eq('id', userId);
}

// ============================================================
// DYNAMIC TRUNCATE
// ============================================================
export function truncateText(text: string, maxLen: number = 10): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}
