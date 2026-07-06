export type UserRole = 'Customer' | 'Partner' | 'Super Admin';
export type PartnerRole = 'owner' | 'finance' | 'supervisor' | 'staff' | 'cashier';
export type SabaaRole = 'super_admin' | 'finance' | 'admin' | 'operations' | 'customer_care' | 'sales' | 'marketing';
export type AppRole = 'customer' | 'partner' | 'superadmin';
export type Lang = 'ar' | 'en' | 'zh' | 'fr' | 'es';
export type Theme = 'light' | 'dark';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'wallet' | 'stcpay' | 'credit';
export type TransactionType = 'credit' | 'debit';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CafeStatus = 'active' | 'suspended' | 'pending' | 'closed';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Addon {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  icon: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  orderId?: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  material: string;
  status: string;
  createdAt: string;
}

export interface PendingMenuItem {
  id: string;
  cafeId: string;
  cafeName: string;
  name: string;
  nameEn: string;
  desc: string;
  basePrice: number;
  icon: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  createdAt: string;
}

export interface Cafe {
  id: number;
  name: string;
  nameEn: string;
  sub: string;
  rating: number;
  isOpen: boolean;
  dist: string;
  emoji: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  logo_url?: string | null;
  favorites: number;
  waitTime: string;
  favorited: boolean;
  email?: string;
  serviceType?: string;
  status?: string;
  menu?: MenuItem[];
  avg_wait_min?: number;
}

export interface CoffeeItem {
  type: string;
  qty: number;
  price: number;
  name: string;
  icon: string;
}

export interface Order {
  id: string;
  cafe: string;
  coffee: string;
  coffeeAr: string;
  amount: number;
  base: number;
  vat: number;
  status: OrderStatus;
  date: string;
  icon: string;
  pickupCode: string;
  pickupTime?: string;
  items?: CoffeeItem[];
}

export interface Transaction {
  title: string;
  titleEn: string;
  amount: number;
  type: TransactionType;
  date: string;
}

export interface PartnerOrder {
  id: string;
  customer: string;
  coffee: string;
  coffeeAr: string;
  time: string;
  status: OrderStatus;
  pickupCode: string;
  pickupTime?: string;
  items?: CoffeeItem[];
}

export interface User {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: string;
  wallet: number;
  lastLogin: string;
  city: string;
}

export interface InventoryItem {
  name: string;
  level: number;
  unit: string;
}

export interface StaffMember {
  name: string;
  role: string;
  shift: string;
  status: string;
  phone?: string;
}

export interface Promo {
  name: string;
  discount: number;
  start: string;
  end: string;
  active: boolean;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  earned: boolean;
}

export interface Reward {
  id: string;
  icon: string;
  title: string;
  desc: string;
  cost: number;
  redeemed: boolean;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
  priority: string;
}

export interface AuditLogEntry {
  time: string;
  user: string;
  action: string;
  type: string;
  details: string;
}

export interface Campaign {
  name: string;
  segment: string;
  reach: number;
  status: string;
  time: string;
}

export interface Partner {
  name: string;
  location: string;
  status: string;
  earnings: string;
  rating: number | string;
  inventory: number;
  inventoryEnabled: boolean;
}

export interface MenuItem {
  name: string;
  nameEn: string;
  cat: string;
  base: number;
  total: number;
  status: string;
  sales: number;
  desc?: string;
  featured?: boolean;
  spicy?: boolean;
  vegan?: boolean;
}

export interface CurrentUser {
  name: string;
  phone: string;
  email: string;
  profileId: string;
  points: number;
  orders: number;
  tier: LoyaltyTier;
  streak: number;
  gender?: string | null;
}

export interface SalesReportSummary {
  totalOrders: number;
  totalRevenue: number;
  totalVat: number;
  totalFees: number;
  netRevenue: number;
  avgOrderValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface SalesByCafe {
  cafeId: string;
  cafeName: string;
  orders: number;
  revenue: number;
}

export interface BestSellingItem {
  name: string;
  sales: number;
  revenue: number;
  cafeName: string;
}

export interface CustomerReportSummary {
  total: number;
  active: number;
  newThisPeriod: number;
  byTier: { tier: string; count: number }[];
}

export interface TopCustomer {
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  tier: string;
}

export interface HourlyOrder {
  hour: number;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  percentage: number;
  color: string;
}
