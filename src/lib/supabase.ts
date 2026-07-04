import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwlbktjwkhlupsvnampt.supabase.co';
const supabaseAnonKey = 'sb_publishable_SBFc3Lk8PSQuUf8PbJxbsg_J5HEnT1X';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- AUTH ----
export async function signInWithPhone(phone: string) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  return supabase.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ---- PROFILES ----
export async function getProfile(authUserId: string) {
  return supabase.from('profiles').select('*').eq('auth_id', authUserId).single();
}

export async function updateProfile(userId: string, data: Record<string, unknown>) {
  return supabase.from('profiles').update(data).eq('id', userId);
}

export async function createProfile(profile: {
  auth_id: string;
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  role?: string;
}) {
  return supabase.from('profiles').insert({
    auth_id: profile.auth_id,
    phone: profile.phone,
    email: profile.email || null,
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role || 'Customer',
    city: 'riyadh',
    wallet_balance: 0,
    loyalty_points: 0,
    loyalty_tier: 'bronze',
    streak: 0,
  }).select().single();
}

// ---- CAFES ----
export async function getCafes() {
  return supabase.from('cafes').select('*').eq('status', 'active');
}

export async function getCafeById(id: string) {
  return supabase.from('cafes').select('*').eq('id', id).single();
}

// ---- MENU ----
export async function getMenuItems(cafeId?: string) {
  let q = supabase.from('menu_items').select('*').eq('status', 'active');
  if (cafeId) q = q.eq('cafe_id', cafeId);
  return q;
}

// ---- ORDERS ----
export async function createOrder(order: Record<string, unknown>) {
  return supabase.from('orders').insert(order).select().single();
}

export async function getOrders(userId: string) {
  return supabase.from('orders').select('*, order_items(*)').eq('customer_id', userId).order('created_at', { ascending: false });
}

export async function getPartnerOrders(cafeId: string) {
  return supabase.from('orders').select('*, order_items(*)').eq('cafe_id', cafeId).order('created_at', { ascending: false });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return supabase.from('orders').update({ status }).eq('id', orderId);
}

// ---- TRANSACTIONS ----
export async function getTransactions(userId: string) {
  return supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export async function addTransaction(tx: Record<string, unknown>) {
  return supabase.from('transactions').insert(tx).select().single();
}

// ---- INVENTORY ----
export async function getInventory(cafeId: string) {
  return supabase.from('inventory_items').select('*').eq('cafe_id', cafeId);
}

export async function updateInventoryLevel(id: string, level: number) {
  return supabase.from('inventory_items').update({ current_level: level }).eq('id', id);
}

// ---- EMPLOYEES ----
export async function getEmployees(cafeId: string) {
  return supabase.from('employees').select('*').eq('cafe_id', cafeId);
}

export async function addEmployee(emp: Record<string, unknown>) {
  return supabase.from('employees').insert(emp).select().single();
}

export async function deleteEmployee(id: string) {
  return supabase.from('employees').delete().eq('id', id);
}

// ---- PROMOTIONS ----
export async function getPromotions(cafeId?: string) {
  let q = supabase.from('promotions').select('*').eq('is_active', true);
  if (cafeId) q = q.eq('cafe_id', cafeId);
  return q;
}

// ---- NOTIFICATIONS ----
export async function getNotifications(userId: string) {
  return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

// ---- AUDIT LOGS ----
export async function addAuditLog(log: Record<string, unknown>) {
  return supabase.from('audit_logs').insert(log);
}

export async function getAuditLogs() {
  return supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
}

// ---- FAVORITES ----
export async function toggleFavorite(userId: string, cafeId: string) {
  const existing = await supabase.from('user_favorites').select('id').eq('user_id', userId).eq('cafe_id', cafeId).maybeSingle();
  if (existing.data) {
    return supabase.from('user_favorites').delete().eq('id', existing.data.id);
  }
  return supabase.from('user_favorites').insert({ user_id: userId, cafe_id: cafeId });
}

// ---- BADGES ----
export async function getBadges() {
  return supabase.from('badges').select('*').order('created_at');
}

export async function getUserBadges(userId: string) {
  return supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId);
}

// ---- REWARDS ----
export async function getRewards() {
  return supabase.from('rewards').select('*').eq('is_active', true);
}

export async function getUserRedemptions(userId: string) {
  return supabase.from('reward_redemptions').select('*').eq('user_id', userId);
}

export async function redeemReward(userId: string, rewardId: string, pointsCost: number) {
  const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', userId).single();
  if (!profile || profile.loyalty_points < pointsCost) {
    throw new Error('نقاط غير كافية');
  }
  const { error: redeemError } = await supabase.from('reward_redemptions').insert({
    user_id: userId, reward_id: rewardId, points_spent: pointsCost,
  });
  if (redeemError) throw redeemError;
  return supabase.from('profiles').update({ loyalty_points: profile.loyalty_points - pointsCost }).eq('id', userId);
}

// ---- SUBSCRIPTIONS ----
export async function getSubscriptionPlans() {
  return supabase.from('subscription_plans').select('*').eq('is_active', true);
}

export async function getAllSubscriptionPlans() {
  return supabase.from('subscription_plans').select('*').order('price_weekly', { ascending: true });
}

export async function createSubscriptionPlan(plan: {
  name_ar: string; name_en: string; description_ar: string; description_en: string;
  price_weekly: number; features: string[];
}) {
  return supabase.from('subscription_plans').insert({
    name_ar: plan.name_ar, name_en: plan.name_en || plan.name_ar,
    description_ar: plan.description_ar, description_en: plan.description_en || plan.description_ar,
    price_weekly: plan.price_weekly, features: JSON.stringify(plan.features),
  }).select().single();
}

export async function updateSubscriptionPlan(id: string, plan: {
  name_ar?: string; name_en?: string; description_ar?: string; description_en?: string;
  price_weekly?: number; features?: string[]; is_active?: boolean;
}) {
  const updates: Record<string, any> = {};
  if (plan.name_ar !== undefined) updates.name_ar = plan.name_ar;
  if (plan.name_en !== undefined) updates.name_en = plan.name_en;
  if (plan.description_ar !== undefined) updates.description_ar = plan.description_ar;
  if (plan.description_en !== undefined) updates.description_en = plan.description_en;
  if (plan.price_weekly !== undefined) updates.price_weekly = plan.price_weekly;
  if (plan.features !== undefined) updates.features = JSON.stringify(plan.features);
  if (plan.is_active !== undefined) updates.is_active = plan.is_active;
  return supabase.from('subscription_plans').update(updates).eq('id', id);
}

export async function deleteSubscriptionPlan(id: string) {
  return supabase.from('subscription_plans').delete().eq('id', id);
}

export async function getUserSubscription(userId: string) {
  return supabase.from('user_subscriptions').select('*, subscription_plans(*)').eq('user_id', userId).maybeSingle();
}

export async function subscribeUser(userId: string, planId: string) {
  const { data: existing } = await supabase.from('user_subscriptions')
    .select('id').eq('user_id', userId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('user_subscriptions').update({ plan_id: planId, start_date: new Date().toISOString(), status: 'active' }).eq('id', existing.id);
    if (!error) {
      await supabase.from('profiles').update({ current_subscription_id: existing.id }).eq('id', userId);
    }
    return { data: existing, error };
  }
  const { data, error } = await supabase.from('user_subscriptions').insert({
    user_id: userId, plan_id: planId, start_date: new Date().toISOString(), status: 'active',
  }).select().single();
  if (data && !error) {
    await supabase.from('profiles').update({ current_subscription_id: data.id }).eq('id', userId);
  }
  return { data, error };
}

export async function cancelSubscription(userId: string) {
  const { data: sub } = await supabase.from('user_subscriptions')
    .select('id').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (!sub) return { error: new Error('No active subscription') };
  return supabase.from('user_subscriptions').update({ status: 'cancelled', end_date: new Date().toISOString() }).eq('id', sub.id);
}

// ---- CAMPAIGNS ----
export async function getCampaigns() {
  return supabase.from('notification_campaigns').select('*').order('created_at', { ascending: false });
}

export async function createCampaign(campaign: Record<string, unknown>) {
  return supabase.from('notification_campaigns').insert(campaign).select().single();
}

// ---- SYSTEM SETTINGS ----
export async function getSystemSettings() {
  return supabase.from('system_settings').select('*');
}

export async function updateSystemSetting(id: string, data: Record<string, unknown>) {
  return supabase.from('system_settings').update(data).eq('id', id);
}

// ---- NOTIFICATION CREATE ----
export async function createNotification(notif: Record<string, unknown>) {
  return supabase.from('notifications').insert(notif).select().single();
}

// ---- CATEGORIES ----
export async function getCategories(cafeId?: string) {
  let q = supabase.from('categories').select('*').order('sort_order');
  if (cafeId) q = q.eq('cafe_id', cafeId);
  return q;
}

// ---- PROFILES (admin) ----
export async function getAllProfiles() {
  return supabase.from('profiles').select('*').order('created_at', { ascending: false });
}

export async function updateProfileRole(userId: string, role: string) {
  return supabase.from('profiles').update({ role }).eq('id', userId);
}

// ---- CAFE CRUD ----
export async function createCafe(data: Record<string, unknown>) {
  return supabase.from('cafes').insert(data).select().single();
}

export async function updateCafe(id: string, data: Record<string, unknown>) {
  return supabase.from('cafes').update(data).eq('id', id);
}

export async function deleteCafe(id: string) {
  return supabase.from('cafes').update({ status: 'suspended' }).eq('id', id);
}

// ---- MENU ITEM CRUD ----
export async function createMenuItem(data: Record<string, unknown>) {
  return supabase.from('menu_items').insert(data).select().single();
}

export async function updateMenuItem(id: string, data: Record<string, unknown>) {
  return supabase.from('menu_items').update(data).eq('id', id);
}

// ---- FULL ORDER CREATION ----
export async function createFullOrder(order: {
  customer_id: string;
  cafe_id: string;
  subtotal: number;
  vat_amount: number;
  platform_fee?: number;
  total_amount: number;
  payment_method: string;
  items: { menu_item_id?: string; item_name_ar: string; icon?: string; quantity: number; unit_price: number; total_price: number }[];
}) {
  const { data: orderData, error: orderError } = await supabase.from('orders').insert({
    order_number: await rpcGenerateOrderNumber(),
    customer_id: order.customer_id,
    cafe_id: order.cafe_id,
    status: 'pending',
    pickup_code: await rpcGeneratePickupCode(),
    subtotal: order.subtotal,
    vat_amount: order.vat_amount,
    platform_fee: order.platform_fee || 0,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    is_paid: order.payment_method === 'wallet',
  }).select().single();

  if (orderError) throw orderError;

  const orderItems = order.items.map((item) => ({
    order_id: orderData.id,
    menu_item_id: item.menu_item_id || null,
    item_name_ar: item.item_name_ar,
    icon: item.icon || '☕',
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  if (order.payment_method === 'wallet') {
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', order.customer_id).single();
    if (profile) {
      await supabase.from('transactions').insert({
        user_id: order.customer_id,
        order_id: orderData.id,
        type: 'debit',
        amount: order.total_amount,
        balance_before: profile.wallet_balance,
        balance_after: profile.wallet_balance - order.total_amount,
        description_ar: `طلب #${orderData.order_number}`,
      });
    }
  }

  return { data: orderData, items: orderItems };
}

async function rpcGenerateOrderNumber(): Promise<string> {
  const { data } = await supabase.rpc('generate_order_number');
  return data || 'SB-1000';
}

async function rpcGeneratePickupCode(): Promise<string> {
  const { data } = await supabase.rpc('generate_pickup_code');
  return data || 'ABCD';
}

// ---- DATA RESET ----
export async function resetUserData(userId: string) {
  await supabase.from('transactions').delete().eq('user_id', userId);
  await supabase.from('orders').delete().eq('customer_id', userId);
}

export async function clearAllOrders() {
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
