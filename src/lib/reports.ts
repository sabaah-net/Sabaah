import { supabase } from './supabase';
import type { SalesReportSummary, SalesByCafe, BestSellingItem, CustomerReportSummary, TopCustomer, HourlyOrder } from '../types';

export async function getSalesSummary(startDate?: string, endDate?: string): Promise<SalesReportSummary> {
  let query = supabase.from('orders').select('total_amount, subtotal, vat_amount, platform_fee, created_at', { count: 'exact' });
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, count, error } = await query;
  if (error) throw error;
  const totalRevenue = data?.reduce((s, r) => s + Number(r.total_amount), 0) || 0;
  const totalVat = data?.reduce((s, r) => s + Number(r.vat_amount), 0) || 0;
  const totalFees = data?.reduce((s, r) => s + Number(r.platform_fee), 0) || 0;
  return {
    totalOrders: count || 0,
    totalRevenue,
    totalVat,
    totalFees,
    netRevenue: totalRevenue - totalVat - totalFees,
    avgOrderValue: (count && count > 0) ? totalRevenue / count : 0,
    periodStart: startDate || 'all',
    periodEnd: endDate || 'all',
  };
}

export async function getSalesByCafe(startDate?: string, endDate?: string): Promise<SalesByCafe[]> {
  let query = supabase
    .from('orders')
    .select('cafe_id, total_amount, cafes!inner(name_ar, name_en)');
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  const grouped = new Map<string, { orders: number; revenue: number; name: string }>();
  for (const row of data || []) {
    const cafe = row.cafes as any;
    const name = cafe?.name_ar || cafe?.name_en || 'Unknown';
    const existing = grouped.get(row.cafe_id) || { orders: 0, revenue: 0, name };
    existing.orders += 1;
    existing.revenue += Number(row.total_amount);
    grouped.set(row.cafe_id, existing);
  }
  return Array.from(grouped.entries())
    .map(([cafeId, v]) => ({ cafeId, cafeName: v.name, orders: v.orders, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getBestSellingItems(startDate?: string, endDate?: string): Promise<BestSellingItem[]> {
  let query = supabase
    .from('order_items')
    .select('item_name_ar, item_name_en, quantity, total_price, order_id, orders!inner(cafe_id, created_at, cafes!inner(name_ar, name_en))');
  if (startDate) query = query.gte('orders.created_at', startDate);
  if (endDate) query = query.lte('orders.created_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  const grouped = new Map<string, { sales: number; revenue: number; cafeName: string }>();
  for (const row of data || []) {
    const name = (row as any).item_name_ar || (row as any).item_name_en || 'Unknown';
    const orders = row.orders as any;
    const cafeName = orders?.cafes?.name_ar || orders?.cafes?.name_en || 'Unknown';
    const existing = grouped.get(name) || { sales: 0, revenue: 0, cafeName };
    existing.sales += row.quantity;
    existing.revenue += Number(row.total_price);
    grouped.set(name, existing);
  }
  return Array.from(grouped.entries())
    .map(([name, v]) => ({ name, sales: v.sales, revenue: v.revenue, cafeName: v.cafeName }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 20);
}

export async function getCustomerSummary(startDate?: string, endDate?: string): Promise<CustomerReportSummary> {
  const { count: total, error: e1 } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'Super Admin');
  if (e1) throw e1;
  let activeQuery = supabase.from('orders').select('customer_id', { count: 'exact', head: true });
  if (startDate) activeQuery = activeQuery.gte('created_at', startDate);
  if (endDate) activeQuery = activeQuery.lte('created_at', endDate);
  const { count: active, error: e2 } = await activeQuery;
  if (e2) throw e2;
  let newQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
  if (startDate) newQuery = newQuery.gte('created_at', startDate);
  if (endDate) newQuery = newQuery.lte('created_at', endDate);
  const { count: newThisPeriod, error: e3 } = await newQuery;
  if (e3) throw e3;
  const { data: tiers, error: e4 } = await supabase.from('profiles')
    .select('loyalty_tier')
    .neq('role', 'Super Admin');
  if (e4) throw e4;
  const tierCount = new Map<string, number>();
  for (const p of tiers || []) {
    tierCount.set(p.loyalty_tier || 'bronze', (tierCount.get(p.loyalty_tier || 'bronze') || 0) + 1);
  }
  return {
    total: total || 0,
    active: active || 0,
    newThisPeriod: newThisPeriod || 0,
    byTier: Array.from(tierCount.entries()).map(([tier, count]) => ({ tier, count })),
  };
}

export async function getTopCustomers(limit = 10, startDate?: string, endDate?: string): Promise<TopCustomer[]> {
  let query = supabase
    .from('orders')
    .select('customer_id, total_amount, profiles!inner(first_name, last_name, email, loyalty_tier)');
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  const grouped = new Map<string, { name: string; email: string; orders: number; totalSpent: number; tier: string }>();
  for (const row of data || []) {
    const profile = row.profiles as any;
    const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown';
    const existing = grouped.get(row.customer_id) || { name, email: profile?.email || '', orders: 0, totalSpent: 0, tier: profile?.loyalty_tier || 'bronze' };
    existing.orders += 1;
    existing.totalSpent += Number(row.total_amount);
    grouped.set(row.customer_id, existing);
  }
  return Array.from(grouped.entries())
    .map(([_, v]) => v)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export async function getHourlyDistribution(startDate?: string, endDate?: string): Promise<HourlyOrder[]> {
  let query = supabase.from('orders').select('created_at');
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  const hourly = new Array(24).fill(0);
  for (const row of data || []) {
    const h = new Date(row.created_at).getHours();
    hourly[h] += 1;
  }
  return hourly.map((count, hour) => ({ hour, count }));
}

export async function getCategoryDistribution(startDate?: string, endDate?: string): Promise<{ category: string; percentage: number; color: string }[]> {
  let query = supabase
    .from('order_items')
    .select('item_name_ar, quantity, orders!inner(created_at)');
  if (startDate) query = query.gte('orders.created_at', startDate);
  if (endDate) query = query.lte('orders.created_at', endDate);
  const { data, error } = await query;
  if (error) throw error;
  const categories = new Map<string, number>();
  for (const row of data || []) {
    const name = (row as any).item_name_ar || 'Unknown';
    const cat = name.includes('سباني') || name.includes('لاتيه') ? 'لاتيه' :
                name.includes('مير') || name.includes('برد') ? 'مير' :
                name.includes('كورتادو') || name.includes('موكا') ? 'داكنة' : 'أخرى';
    categories.set(cat, (categories.get(cat) || 0) + row.quantity);
  }
  const total = Array.from(categories.values()).reduce((s, v) => s + v, 0) || 1;
  const colors = ['#C0692A', '#2A7A52', '#1E5F9E', '#9B7B68'];
  return Array.from(categories.entries())
    .map(([cat, count], i) => ({ category: cat, percentage: Math.round((count / total) * 100), color: colors[i % colors.length] }))
    .sort((a, b) => b.percentage - a.percentage);
}
