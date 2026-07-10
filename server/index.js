import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://sabaah-396a8-default-rtdb.asia-southeast1.firebasedatabase.app';
const API_KEY = process.env.API_KEY || '';

let serviceAccount;
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (raw) {
  try { serviceAccount = JSON.parse(raw); } catch { serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString()); }
} else {
  try { serviceAccount = (await import('./service-account.json', { assert: { type: 'json' } })).default; } catch {}
}

if (!serviceAccount) {
  console.error('FATAL: No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT env var or provide service-account.json');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL,
  });
}

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

function requireAuth(req, res, next) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/api', requireAuth);

function pathRef(path) {
  return db.ref(path.replace(/^\/+/, ''));
}

app.get('/api/data/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    const snap = await pathRef(path).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/data/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    await pathRef(path).set(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/data/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    await pathRef(path).update(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/data/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    await pathRef(path).remove();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/push', async (req, res) => {
  try {
    const { path, data } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });
    const newRef = pathRef(path).push();
    const id = newRef.key;
    await newRef.set({ id, ...data, createdAt: new Date().toISOString() });
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/uid', async (req, res) => {
  try {
    const { path, id, data } = req.body;
    if (!path || !id) return res.status(400).json({ error: 'path and id required' });
    const full = { id, ...data, createdAt: new Date().toISOString() };
    await pathRef(`${path}/${id}`).set(full);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/verify-pickup', async (req, res) => {
  try {
    const { cafeId, code } = req.body;
    const normalized = String(code).trim().toUpperCase();
    if (!normalized) return res.json(null);
    const ordersSnap = await db.ref('orders').once('value');
    const all = ordersSnap.val() || {};
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
          await db.ref(`orders/${userId}/${orderId}`).update({ status: 'completed', pickupCodeUsed: true, pickupVerifiedAt: new Date().toISOString() });
          return res.json({ userId, orderId, order });
        }
      }
    }
    res.json(null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { path, orderBy, limitToLast: limit } = req.body;
    let query = pathRef(path);
    if (orderBy) query = query.orderByChild(orderBy);
    if (limit) query = query.limitToLast(limit);
    const snap = await query.once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sabaa Firebase Admin Server running on port ${PORT}`);
  console.log(`Database: ${DATABASE_URL}`);
});
