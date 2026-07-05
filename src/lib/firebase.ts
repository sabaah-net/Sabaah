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

// ─── Notifications ─────────────────────────────────────────
export function pushNotification(userId: string, notif: Omit<Notification, 'id' | 'createdAt'>): string {
  const id = uid();
  const data = { id, ...notif, createdAt: nowISO() };
  console.log('🔔 pushNotification:', userId, data);
  const r = ref(db, `notifications/${userId}/${id}`);
  set(r, data).then(() => {
    console.log('✅ Notification written to Firebase');
  }).catch((err) => {
    console.error('❌ Firebase write failed:', err);
  });
  return id;
}

export function watchNotifications(userId: string, cb: (notifs: Notification[]) => void): () => void {
  const r = ref(db, `notifications/${userId}`);
  const fn = onValue(r, (snap) => {
    const val = snap.val();
    cb(val ? Object.values(val) as Notification[] : []);
  });
  return () => off(r, 'value', fn);
}

export function markNotifRead(userId: string, notifId: string) {
  update(ref(db, `notifications/${userId}/${notifId}`), { read: true });
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

export { app, db, analytics };
