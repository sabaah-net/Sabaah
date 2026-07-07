import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase, ref, push, set, remove, onValue, off, query, orderByChild, limitToLast, get, update, type DatabaseReference,
} from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Order, Transaction, Notification, Complaint, Supplier } from '../types';

const firebaseConfig = {
  apiKey: 'AIzaSyCNUvYSRF9mOscF48fnmvE4FmaarDhLhGE',
  authDomain: 'sabaah-396a8.firebaseapp.com',
  databaseURL: 'https://sabaah-396a8-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'sabaah-396a8',
  storageBucket: 'sabaah-396a8.firebasestorage.app',
  messagingSenderId: '92089874717',
  appId: '1:92089874717:web:08ff1e87021cff5da489f4',
  measurementId: 'G-93T9EEBLT6',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((s) => { if (s) analytics = getAnalytics(app); });
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Orders ────────────────────────────────────────────────
export function pushOrder(userId: string, order: Omit<Order, 'id' | 'createdAt'>): string {
  const id = uid();
  const data = { id, ...order, createdAt: nowISO() };
  console.log('📦 pushOrder:', userId, data);
  const r = ref(db, `orders/${userId}/${id}`);
  set(r, data).then(() => {
    console.log('✅ Order written to Firebase');
  }).catch((err) => {
    console.error('❌ Firebase order write failed:', err);
  });
  return id;
}

export function watchOrders(userId: string, cb: (orders: Order[]) => void): () => void {
  const r = ref(db, `orders/${userId}`);
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Order[] : []);
  });
  return () => off(r, 'value', fn);
}

export function updateOrderStatusInFirebase(userId: string, orderId: string, status: string) {
  update(ref(db, `orders/${userId}/${orderId}`), { status });
}

export async function verifyPickupCodeOnce(cafeId: string | number | undefined, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const snap = await get(ref(db, 'orders'));
  const all = snap.val() || {};
  const cafeToken = cafeId !== undefined && cafeId !== null ? String(cafeId) : '';

  for (const userId of Object.keys(all)) {
    for (const orderId of Object.keys(all[userId] || {})) {
      const order = all[userId][orderId] || {};
      const orderCode = String(order.pickupCode || '').trim().toUpperCase();
      const orderCafe = String(order.cafeId || order.cafe_uuid || order.cafe || '').trim();
      const isCafeMatch = !cafeToken || orderCafe === cafeToken || String(order.userId || '') === cafeToken;
      const isActive = order.status === 'pending' || order.status === 'preparing' || order.status === 'ready';
      const alreadyUsed = Boolean(order.pickupVerifiedAt || order.pickupCodeUsed || order.status === 'picked' || order.status === 'completed');

      if (isCafeMatch && isActive && !alreadyUsed && orderCode === normalized) {
        await update(ref(db, `orders/${userId}/${orderId}`), {
          status: 'completed',
          pickupCodeUsed: true,
          pickupVerifiedAt: nowISO(),
        });
        return { userId, orderId, order };
      }
    }
  }

  return null;
}

export function watchAllOrders(cb: (orders: any[]) => void): () => void {
  const r = ref(db, 'orders');
  const fn = onValue(r, (snap) => {
    const val: Record<string, any> = snap.val() || {};
    const list: any[] = [];
    for (const uid of Object.keys(val)) {
      for (const oid of Object.keys(val[uid])) {
        list.push({ userId: uid, id: oid, ...val[uid][oid] });
      }
    }
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    cb(list);
  });
  return () => off(r, 'value', fn);
}

// ─── Transactions ──────────────────────────────────────────
export function pushTransaction(userId: string, txn: Omit<Transaction, 'id' | 'createdAt'>): string {
  const id = uid();
  set(ref(db, `transactions/${userId}/${id}`), { id, ...txn, createdAt: nowISO() });
  return id;
}

export function watchTransactions(userId: string, cb: (txns: Transaction[]) => void): () => void {
  const r = ref(db, `transactions/${userId}`);
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Transaction[] : []);
  });
  return () => off(r, 'value', fn);
}

// ─── Notifications (global flat path) ──────────────────────
export function pushNotification(userId: string, notif: Omit<Notification, 'id' | 'createdAt'>): string {
  const id = uid();
  const data = { id, userId, ...notif, createdAt: nowISO() };
  console.log('🔔 pushNotification:', userId, data);
  const r = ref(db, `notifications/${id}`);
  set(r, data).then(() => {
    console.log('✅ Notification written to Firebase');
  }).catch((err) => {
    console.error('❌ Firebase write failed:', err);
  });
  return id;
}

export function watchNotifications(userId: string, cb: (notifs: Notification[]) => void): () => void {
  const r = ref(db, 'notifications');
  const fn = onValue(r, (snap) => {
    const val: Record<string, any> = snap.val() || {};
    const filtered = Object.values(val).filter((n: any) => n.userId === userId || !n.userId) as Notification[];
    cb(filtered);
  });
  return () => off(r, 'value', fn);
}

export function markNotifRead(userId: string, notifId: string) {
  update(ref(db, `notifications/${notifId}`), { read: true });
}

// ─── Complaints ────────────────────────────────────────────
export function pushComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = uid();
  set(ref(db, `complaints/${id}`), { id, ...complaint, createdAt: nowISO() });
  return id;
}

export function watchComplaints(cb: (complaints: Complaint[]) => void): () => void {
  const r = ref(db, 'complaints');
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Complaint[] : []);
  });
  return () => off(r, 'value', fn);
}

export function updateComplaint(id: string, data: Partial<Complaint>) {
  update(ref(db, `complaints/${id}`), { ...data, updatedAt: nowISO() });
}

// ─── Suppliers ─────────────────────────────────────────────
export function pushSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): string {
  const id = uid();
  set(ref(db, `suppliers/${id}`), { id, ...supplier, createdAt: nowISO() });
  return id;
}

export function watchSuppliers(cb: (suppliers: Supplier[]) => void): () => void {
  const r = ref(db, 'suppliers');
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Supplier[] : []);
  });
  return () => off(r, 'value', fn);
}

export function updateSupplier(id: string, data: Partial<Supplier>) {
  update(ref(db, `suppliers/${id}`), { ...data, updatedAt: nowISO() });
}

export function removeSupplier(id: string) {
  remove(ref(db, `suppliers/${id}`));
}

// ─── Promotions ────────────────────────────────────────────
export function pushPromo(cafeId: string, promo: { name_ar: string; discount_percent: number; start_time: string; end_time: string; is_active: boolean }): string {
  const id = uid();
  set(ref(db, `promos/${cafeId}/${id}`), { id, ...promo, createdAt: nowISO() });
  return id;
}

export function watchPromos(cafeId: string, cb: (promos: any[]) => void): () => void {
  const r = ref(db, `promos/${cafeId}`);
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) : []);
  });
  return () => off(r, 'value', fn);
}

export function togglePromoActive(cafeId: string, promoId: string, isActive: boolean) {
  update(ref(db, `promos/${cafeId}/${promoId}`), { is_active: isActive });
}

export function deletePromo(cafeId: string, promoId: string) {
  remove(ref(db, `promos/${cafeId}/${promoId}`));
}

// ─── Subscriptions ─────────────────────────────────────────
export function pushSubscription(userId: string, sub: {
  plan_id: string; plan_name: string; price_weekly: number;
  start_date: string; end_date: string; status: string;
  auto_renew: boolean;
}): string {
  const id = uid();
  set(ref(db, `subscriptions/${userId}/${id}`), { id, ...sub, createdAt: nowISO() });
  return id;
}

export function watchSubscriptions(userId: string, cb: (subs: any[]) => void): () => void {
  const r = ref(db, `subscriptions/${userId}`);
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) : []);
  });
  return () => off(r, 'value', fn);
}

export function cancelSubscriptionInFirebase(userId: string, subId: string) {
  update(ref(db, `subscriptions/${userId}/${subId}`), { status: 'cancelled' });
}

// ─── Cafe Status (real-time open/close) ────────────────────
export function saveCafeStatus(cafeUuid: string, isOpen: boolean) {
  set(ref(db, `cafe_status/${cafeUuid}`), { is_open: isOpen, updatedAt: nowISO() });
}

export function watchAllCafeStatus(cb: (statuses: Record<string, boolean>) => void): () => void {
  const r = ref(db, 'cafe_status');
  const fn = onValue(r, (snap) => {
    const val: Record<string, any> = snap.val() || {};
    const out: Record<string, boolean> = {};
    for (const uid of Object.keys(val)) {
      out[uid] = val[uid].is_open ?? true;
    }
    cb(out);
  });
  return () => off(r, 'value', fn);
}

export { app, db, analytics };
