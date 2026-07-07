'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t, getStatusLabel } from '../../i18n';
import { watchAllOrders, updateOrderStatusInFirebase } from '../../lib/firebase';

export default function PartnerOrders({ cafeId }: { cafeId: string | null }) {
  const store = useAppStore();
  const lang = store.lang;
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [verifyCodes, setVerifyCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    return watchAllOrders((orders) => setAllOrders(orders));
  }, []);

  const cafeOrders = allOrders.filter(o => {
    if (!cafeId) return true;
    return String(o.cafeId) === String(cafeId) || String(o.cafe_id) === String(cafeId);
  });

  const activeOrders = cafeOrders.filter((o) => o.status !== 'completed');

  const handleVerify = (order: any) => {
    const code = verifyCodes[order.id]?.toUpperCase() || '';
    if (code && code !== order.pickupCode) {
      alert(lang === 'ar' ? '❌ كود الاستلام غير صحيح' : '❌ Invalid pickup code');
      return;
    }
    const uid = order.userId;
    if (uid) updateOrderStatusInFirebase(uid, order.id, 'completed');
    setVerifyCodes({ ...verifyCodes, [order.id]: '' });
  };

  return (
    <div>
      <p className="section-title">{t('partner_orders_current', lang)}</p>
      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)' }}>
          {lang === 'ar' ? '✅ لا توجد طلبات حالية' : '✅ No current orders'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {activeOrders.map((o) => (
            <div key={`${o.userId}-${o.id}`} style={{
              background: '#fff', borderRadius: 'var(--r-md)', padding: 14,
              boxShadow: 'var(--sh-sm)', borderRight: `4px solid ${o.status === 'pending' ? 'var(--amber)' : 'var(--blue)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                <div style={{ fontSize: '.68rem', color: 'var(--text-light)' }}>#{o.id}</div>
                <span style={{
                  fontSize: '.72rem', fontWeight: 700, padding: '4px 11px', borderRadius: 40,
                  background: o.status === 'pending' ? '#FFF4E0' : o.status === 'preparing' || o.status === 'ready' ? 'var(--orange-bg)' : 'var(--green-bg)',
                  color: o.status === 'pending' ? '#B07D1A' : o.status === 'preparing' || o.status === 'ready' ? 'var(--orange)' : 'var(--green)',
                }}>
                  {getStatusLabel(o.status as any, 'ar')}
                </span>
              </div>
              <div className="order-code-display">{o.pickupCode}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--text-light)', textAlign: 'center', marginBottom: 10 }}>
                {t('partner_pickup_code', lang)}
              </div>
              <div style={{ fontSize: '.82rem', marginBottom: 10 }}>
                <div>👤 <strong>{o.customerName || o.customer_name || '—'}</strong></div>
                <div>☕ <strong>{o.coffee || o.coffeeAr || '—'}</strong></div>
                <div>🕐 <strong>{o.pickupTime || o.time || '—'}</strong></div>
              </div>
              {o.status !== 'completed' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-input"
                    placeholder={t('partner_pickup_placeholder', lang)}
                    style={{ margin: 0, textAlign: 'center', letterSpacing: 3, fontWeight: 900 }}
                    value={verifyCodes[o.id] || ''}
                    onChange={(e) => setVerifyCodes({ ...verifyCodes, [o.id]: e.target.value })}
                  />
                  <button className="action-btn green-btn" style={{ width: 'auto', padding: '0 16px', fontSize: '.8rem' }}
                    onClick={() => handleVerify(o)}>{t('partner_verify', lang)}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
