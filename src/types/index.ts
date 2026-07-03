export type UserRole = 'Customer' | 'Partner' | 'Admin' | 'Operations Admin' | 'Finance Admin' | 'Super Admin';
export type AppRole = 'customer' | 'partner' | 'superadmin';
export type Lang = 'ar' | 'en' | 'zh' | 'fr' | 'es';
export type Theme = 'light' | 'dark';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'wallet' | 'card' | 'apple';
export type TransactionType = 'credit' | 'debit';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

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
  favorites: number;
  waitTime: string;
  favorited: boolean;
  email?: string;
  serviceType?: string;
  status?: string;
  menu?: MenuItem[];
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
