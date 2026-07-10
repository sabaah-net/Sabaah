let API_BASE = '';
let API_KEY = '';

export function configureFirebaseApi(baseUrl: string, apiKey = '') {
  API_BASE = baseUrl.replace(/\/+$/, '');
  API_KEY = apiKey;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h['x-api-key'] = API_KEY;
  return h;
}

export async function get<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/data/${encodeURIComponent(path)}`, { headers: headers() });
  if (!res.ok) throw new Error(`Firebase API GET ${path}: ${res.status}`);
  return res.json();
}

export async function put(path: string, data: any) {
  const res = await fetch(`${API_BASE}/api/data/${encodeURIComponent(path)}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase API PUT ${path}: ${res.status}`);
}

export async function patch(path: string, data: any) {
  const res = await fetch(`${API_BASE}/api/data/${encodeURIComponent(path)}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase API PATCH ${path}: ${res.status}`);
}

export async function del(path: string) {
  const res = await fetch(`${API_BASE}/api/data/${encodeURIComponent(path)}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error(`Firebase API DELETE ${path}: ${res.status}`);
}

async function push(path: string, data: any): Promise<string> {
  const res = await fetch(`${API_BASE}/api/push`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ path, data }),
  });
  if (!res.ok) throw new Error(`Firebase API push ${path}: ${res.status}`);
  const { id } = await res.json();
  return id;
}

async function setWithId(path: string, id: string, data: any) {
  const res = await fetch(`${API_BASE}/api/uid`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ path, id, data }),
  });
  if (!res.ok) throw new Error(`Firebase API setWithId ${path}/${id}: ${res.status}`);
}

export function pushOrder(userId: string, order: any): Promise<string> {
  return push(`orders/${userId}`, order);
}

export function watchOrders(userId: string, cb: (orders: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get(`orders/${userId}`);
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function updateOrderStatusInFirebase(userId: string, orderId: string, status: string) {
  return patch(`orders/${userId}/${orderId}`, { status });
}

export async function verifyPickupCodeOnce(cafeId: string | number | undefined, code: string) {
  const res = await fetch(`${API_BASE}/api/verify-pickup`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ cafeId, code }),
  });
  if (!res.ok) return null;
  return res.json();
}

export function watchAllOrders(cb: (orders: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get('orders');
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        const list: any[] = [];
        for (const uid of Object.keys(val || {})) {
          for (const oid of Object.keys(val[uid])) {
            list.push({ userId: uid, id: oid, ...val[uid][oid] });
          }
        }
        list.sort((a, b) => ((b.createdAt || '') as string).localeCompare(a.createdAt || ''));
        cb(list);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function pushTransaction(userId: string, txn: any): Promise<string> {
  return push(`transactions/${userId}`, txn);
}

export function watchTransactions(userId: string, cb: (txns: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get(`transactions/${userId}`);
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function pushNotification(userId: string, notif: any): Promise<string> {
  const data = { userId, ...notif };
  return push('notifications', data);
}

export function watchNotifications(userId: string, cb: (notifs: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get('notifications');
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        const filtered = Object.values(val || {}).filter((n: any) => n.userId === userId || !n.userId);
        cb(filtered);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function markNotifRead(userId: string, notifId: string) {
  return patch(`notifications/${notifId}`, { read: true });
}

export function pushComplaint(complaint: any): Promise<string> {
  return push('complaints', complaint);
}

export function watchComplaints(cb: (complaints: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get('complaints');
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function updateComplaint(id: string, data: any) {
  return patch(`complaints/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export function pushSupplier(supplier: any): Promise<string> {
  return push('suppliers', supplier);
}

export function watchSuppliers(cb: (suppliers: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get('suppliers');
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function updateSupplier(id: string, data: any) {
  return patch(`suppliers/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export function removeSupplier(id: string) {
  return del(`suppliers/${id}`);
}

export function pushPromo(cafeId: string, promo: any): Promise<string> {
  return push(`promos/${cafeId}`, promo);
}

export function watchPromos(cafeId: string, cb: (promos: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get(`promos/${cafeId}`);
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function togglePromoActive(cafeId: string, promoId: string, isActive: boolean) {
  return patch(`promos/${cafeId}/${promoId}`, { is_active: isActive });
}

export function deletePromo(cafeId: string, promoId: string) {
  return del(`promos/${cafeId}/${promoId}`);
}

export function pushSubscription(userId: string, sub: any): Promise<string> {
  return push(`subscriptions/${userId}`, sub);
}

export function watchSubscriptions(userId: string, cb: (subs: any[]) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get(`subscriptions/${userId}`);
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        cb(val ? Object.values(val) : []);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}

export function cancelSubscriptionInFirebase(userId: string, subId: string) {
  return patch(`subscriptions/${userId}/${subId}`, { status: 'cancelled' });
}

export function saveCafeStatus(cafeUuid: string, isOpen: boolean) {
  return setWithId('cafe_status', cafeUuid, { is_open: isOpen, updatedAt: new Date().toISOString() });
}

export function watchAllCafeStatus(cb: (statuses: Record<string, boolean>) => void): () => void {
  let prev = '';
  const poll = async () => {
    try {
      const val: any = await get('cafe_status');
      const json = JSON.stringify(val);
      if (json !== prev) {
        prev = json;
        const out: Record<string, boolean> = {};
        for (const uid of Object.keys(val || {})) {
          out[uid] = val[uid].is_open ?? true;
        }
        cb(out);
      }
    } catch {}
  };
  poll();
  const id = setInterval(poll, 3000);
  return () => clearInterval(id);
}
