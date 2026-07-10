import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase, ref as sdkRef, onValue as sdkOnValue, off as sdkOff,
  set as sdkSet, update as sdkUpdate, remove as sdkRemove, get as sdkGet,
  query as sdkQuery, orderByChild as sdkOrderByChild, limitToLast as sdkLimitToLast,
} from 'firebase/database';
import type { DatabaseReference } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Order, Transaction, Notification, Complaint, Supplier } from '../types';
import * as api from './firebase-api';

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
const realDb = getDatabase(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((s) => { if (s) analytics = getAnalytics(app); });
}

let _useApi = false;
export function configureFirebaseApi(baseUrl: string, apiKey = '') {
  _useApi = true;
  api.configureFirebaseApi(baseUrl, apiKey);
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Proxied database exports (compat with firebase/database) ───

// A ref is just a path wrapper
interface ApiRef { __isApi: true; path: string; _listeners?: Set<() => void>; }

export function ref(dbOrPath: any, path?: string): any {
  if (_useApi) {
    return { __isApi: true, path: path || dbOrPath, _listeners: new Set() } as ApiRef;
  }
  return path ? sdkRef(dbOrPath, path) : sdkRef(realDb, dbOrPath);
}

export function onValue(r: any, cb: (snap: { val: () => any }) => void): any {
  if (_useApi && r.__isApi) {
    let prev = '';
    const poll = async () => {
      try {
        const val = await api.get(r.path);
        const json = JSON.stringify(val);
        if (json !== prev) { prev = json; cb({ val: () => val }); }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 3000);
    const unsub = () => clearInterval(id);
    r._listeners?.add(unsub);
    return unsub;
  }
  const fn = sdkOnValue(r, cb);
  const unsub = () => sdkOff(r, 'value', fn);
  return unsub;
}

export function off(r: any, evt?: string, fn?: any) {
  if (_useApi && r.__isApi) {
    r._listeners?.forEach((u: () => void) => u());
    r._listeners?.clear();
    return;
  }
  if (fn) sdkOff(r, evt as any, fn);
  else if (evt) sdkOff(r, evt as any);
  else sdkOff(r);
}

export function set(r: any, data: any): Promise<void> {
  if (_useApi && r.__isApi) {
    return api.put(r.path, data) as unknown as Promise<void>;
  }
  return sdkSet(r, data);
}

export function update(r: any, data: any): Promise<void> {
  if (_useApi && r.__isApi) {
    return api.patch(r.path, data) as unknown as Promise<void>;
  }
  return sdkUpdate(r, data);
}

export function remove(r: any): Promise<void> {
  if (_useApi && r.__isApi) {
    return api.del(r.path) as unknown as Promise<void>;
  }
  return sdkRemove(r);
}

export function get(r: any): Promise<any> {
  if (_useApi && r.__isApi) {
    return api.get(r.path).then((val: any) => ({ val: () => val }));
  }
  return sdkGet(r);
}

export function query(r: any, ...args: any[]): any {
  if (_useApi && r.__isApi) return r;
  return (sdkQuery as any)(r, ...args);
}

export function orderByChild(child: string): any {
  if (_useApi) return child;
  return sdkOrderByChild(child);
}

export function limitToLast(limit: number): any {
  if (_useApi) return limit;
  return sdkLimitToLast(limit);
}

// db is used as ref(db, path) — in API mode the ref ignores the first arg
// eslint-disable-next-line prefer-const
export let db: any = realDb;

// ─── Orders ────────────────────────────────────────────────
export function pushOrder(userId: string, order: Omit<Order, 'id' | 'createdAt'>): string {
  if (_useApi) { api.pushOrder(userId, order); return uid(); }
  const id = uid();
  const data = { id, ...order, createdAt: nowISO() };
  sdkSet(sdkRef(realDb, `orders/${userId}/${id}`), data).catch((err) => { console.error('❌ Firebase order write failed:', err); });
  return id;
}

export function watchOrders(userId: string, cb: (orders: Order[]) => void): () => void {
  if (_useApi) return api.watchOrders(userId, cb);
  const r = sdkRef(realDb, `orders/${userId}`);
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Order[] : []);
  });
  return () => sdkOff(r, 'value', fn);
}

export function updateOrderStatusInFirebase(userId: string, orderId: string, status: string) {
  if (_useApi) return api.updateOrderStatusInFirebase(userId, orderId, status);
  sdkUpdate(sdkRef(realDb, `orders/${userId}/${orderId}`), { status });
}

export async function verifyPickupCodeOnce(cafeId: string | number | undefined, code: string) {
  if (_useApi) return api.verifyPickupCodeOnce(cafeId, code);
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const snap = await sdkGet(sdkRef(realDb, 'orders'));
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
        await sdkUpdate(sdkRef(realDb, `orders/${userId}/${orderId}`), {
          status: 'completed', pickupCodeUsed: true, pickupVerifiedAt: nowISO(),
        });
        return { userId, orderId, order };
      }
    }
  }
  return null;
}

export function watchAllOrders(cb: (orders: any[]) => void): () => void {
  if (_useApi) return api.watchAllOrders(cb);
  const r = sdkRef(realDb, 'orders');
  const fn = sdkOnValue(r, (snap) => {
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
  return () => sdkOff(r, 'value', fn);
}

// ─── Transactions ──────────────────────────────────────────
export function pushTransaction(userId: string, txn: Omit<Transaction, 'id' | 'createdAt'>): string {
  if (_useApi) { api.pushTransaction(userId, txn); return uid(); }
  const id = uid();
  sdkSet(sdkRef(realDb, `transactions/${userId}/${id}`), { id, ...txn, createdAt: nowISO() });
  return id;
}

export function watchTransactions(userId: string, cb: (txns: Transaction[]) => void): () => void {
  if (_useApi) return api.watchTransactions(userId, cb);
  const r = sdkRef(realDb, `transactions/${userId}`);
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Transaction[] : []);
  });
  return () => sdkOff(r, 'value', fn);
}

// ─── Notifications ─────────────────────────────────────────
export function pushNotification(userId: string, notif: Omit<Notification, 'id' | 'createdAt'>): string {
  if (_useApi) { api.pushNotification(userId, notif); return uid(); }
  const id = uid();
  const data = { id, userId, ...notif, createdAt: nowISO() };
  sdkSet(sdkRef(realDb, `notifications/${id}`), data).catch((err) => { console.error('❌ Firebase write failed:', err); });
  return id;
}

export function watchNotifications(userId: string, cb: (notifs: Notification[]) => void): () => void {
  if (_useApi) return api.watchNotifications(userId, cb);
  const r = sdkRef(realDb, 'notifications');
  const fn = sdkOnValue(r, (snap) => {
    const val: Record<string, any> = snap.val() || {};
    const filtered = Object.values(val).filter((n: any) => n.userId === userId || !n.userId) as Notification[];
    cb(filtered);
  });
  return () => sdkOff(r, 'value', fn);
}

export function markNotifRead(userId: string, notifId: string) {
  if (_useApi) return api.markNotifRead(userId, notifId);
  sdkUpdate(sdkRef(realDb, `notifications/${notifId}`), { read: true });
}

// ─── Complaints ────────────────────────────────────────────
export function pushComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): string {
  if (_useApi) { api.pushComplaint(complaint); return uid(); }
  const id = uid();
  sdkSet(sdkRef(realDb, `complaints/${id}`), { id, ...complaint, createdAt: nowISO() });
  return id;
}

export function watchComplaints(cb: (complaints: Complaint[]) => void): () => void {
  if (_useApi) return api.watchComplaints(cb);
  const r = sdkRef(realDb, 'complaints');
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Complaint[] : []);
  });
  return () => sdkOff(r, 'value', fn);
}

export function updateComplaint(id: string, data: Partial<Complaint>) {
  if (_useApi) return api.updateComplaint(id, data);
  sdkUpdate(sdkRef(realDb, `complaints/${id}`), { ...data, updatedAt: nowISO() });
}

// ─── Suppliers ─────────────────────────────────────────────
export function pushSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): string {
  if (_useApi) { api.pushSupplier(supplier); return uid(); }
  const id = uid();
  sdkSet(sdkRef(realDb, `suppliers/${id}`), { id, ...supplier, createdAt: nowISO() });
  return id;
}

export function watchSuppliers(cb: (suppliers: Supplier[]) => void): () => void {
  if (_useApi) return api.watchSuppliers(cb);
  const r = sdkRef(realDb, 'suppliers');
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Supplier[] : []);
  });
  return () => sdkOff(r, 'value', fn);
}

export function updateSupplier(id: string, data: Partial<Supplier>) {
  if (_useApi) return api.updateSupplier(id, data);
  sdkUpdate(sdkRef(realDb, `suppliers/${id}`), { ...data, updatedAt: nowISO() });
}

export function removeSupplier(id: string) {
  if (_useApi) return api.removeSupplier(id);
  sdkRemove(sdkRef(realDb, `suppliers/${id}`));
}

// ─── Promotions ────────────────────────────────────────────
export function pushPromo(cafeId: string, promo: { name_ar: string; discount_percent: number; start_time: string; end_time: string; is_active: boolean }): string {
  if (_useApi) { api.pushPromo(cafeId, promo); return uid(); }
  const id = uid();
  sdkSet(sdkRef(realDb, `promos/${cafeId}/${id}`), { id, ...promo, createdAt: nowISO() });
  return id;
}

export function watchPromos(cafeId: string, cb: (promos: any[]) => void): () => void {
  if (_useApi) return api.watchPromos(cafeId, cb);
  const r = sdkRef(realDb, `promos/${cafeId}`);
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) : []);
  });
  return () => sdkOff(r, 'value', fn);
}

export function togglePromoActive(cafeId: string, promoId: string, isActive: boolean) {
  if (_useApi) return api.togglePromoActive(cafeId, promoId, isActive);
  sdkUpdate(sdkRef(realDb, `promos/${cafeId}/${promoId}`), { is_active: isActive });
}

export function deletePromo(cafeId: string, promoId: string) {
  if (_useApi) return api.deletePromo(cafeId, promoId);
  sdkRemove(sdkRef(realDb, `promos/${cafeId}/${promoId}`));
}

// ─── Subscriptions ─────────────────────────────────────────
export function pushSubscription(userId: string, sub: {
  plan_id: string; plan_name: string; price_weekly: number;
  start_date: string; end_date: string; status: string;
  auto_renew: boolean;
}): string {
  if (_useApi) { api.pushSubscription(userId, sub); return uid(); }
  const id = uid();
  sdkSet(sdkRef(realDb, `subscriptions/${userId}/${id}`), { id, ...sub, createdAt: nowISO() });
  return id;
}

export function watchSubscriptions(userId: string, cb: (subs: any[]) => void): () => void {
  if (_useApi) return api.watchSubscriptions(userId, cb);
  const r = sdkRef(realDb, `subscriptions/${userId}`);
  const fn = sdkOnValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) : []);
  });
  return () => sdkOff(r, 'value', fn);
}

export function cancelSubscriptionInFirebase(userId: string, subId: string) {
  if (_useApi) return api.cancelSubscriptionInFirebase(userId, subId);
  sdkUpdate(sdkRef(realDb, `subscriptions/${userId}/${subId}`), { status: 'cancelled' });
}

// ─── Cafe Status ───────────────────────────────────────────
export function saveCafeStatus(cafeUuid: string, isOpen: boolean) {
  if (_useApi) return api.saveCafeStatus(cafeUuid, isOpen);
  sdkSet(sdkRef(realDb, `cafe_status/${cafeUuid}`), { is_open: isOpen, updatedAt: nowISO() });
}

export function watchAllCafeStatus(cb: (statuses: Record<string, boolean>) => void): () => void {
  if (_useApi) return api.watchAllCafeStatus(cb);
  const r = sdkRef(realDb, 'cafe_status');
  const fn = sdkOnValue(r, (snap) => {
    const val: Record<string, any> = snap.val() || {};
    const out: Record<string, boolean> = {};
    for (const uid of Object.keys(val)) {
      out[uid] = val[uid].is_open ?? true;
    }
    cb(out);
  });
  return () => sdkOff(r, 'value', fn);
}

export { app, analytics };

