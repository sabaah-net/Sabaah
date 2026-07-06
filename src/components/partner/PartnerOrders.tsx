'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t, getStatusLabel } from '../../i18n';

const PLACEHOLDER_ORDERS = [
  { id: 'ORD-001', customer: 'Ahmed S.', coffeeAr: 'قهوة سوداء', time: '10:30', pickupCode: 'A7B2', status: 'pending' as const },
  { id: 'ORD-002', customer: 'Noura K.', coffeeAr: 'لاتيه', time: '10:45', pickupCode: 'C3D9', status: 'preparing' as const },
  { id: 'ORD-003', customer: 'Faisal M.', coffeeAr: 'اسبريسو', time: '11:00', pickupCode: 'E1F4', status: 'pending' as const },
  { id: 'ORD-004', customer: 'Sara A.', coffeeAr: 'موكا', time: '11:15', pickupCode: 'G8H2', status: 'completed' as const },
  { id: 'ORD-005', customer: 'Khalid R.', coffeeAr: 'سبانش لاتيه', time: '11:30', pickupCode: 'J5K7', status: 'preparing' as const },
];

export default function PartnerOrders() {
  const store = useAppStore();
  const lang = store.lang;
  const [verifyCodes, setVerifyCodes] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState(PLACEHOLDER_ORDERS);

  const displayOrders = store.partnerOrders.length > 0
    ? store.partnerOrders.map((o) => ({
        id: o.id,
        customer: o.customer || '—',
        coffeeAr: o.coffeeAr || o.coffee || '—',
        time: o.time || '—',
        pickupCode: o.pickupCode || '',
        status: o.status || 'pending',
      }))
    : orders;

  const handleVerify = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'completed' as const } : o))
    );
  };

  const activeOrders = displayOrders.filter((o) => o.status !== 'completed');

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
            <div key={o.id} style={{
              background: '#fff', borderRadius: 'var(--r-md)', padding: 14,
              boxShadow: 'var(--sh-sm)', borderRight: '4px solid var(--amber)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                <div style={{ fontSize: '.68rem', color: 'var(--text-light)' }}>#{o.id}</div>
                <span style={{
                  fontSize: '.72rem', fontWeight: 700, padding: '4px 11px', borderRadius: 40,
                  background: o.status === 'pending' ? '#FFF4E0' : o.status === 'preparing' ? 'var(--orange-bg)' : 'var(--green-bg)',
                  color: o.status === 'pending' ? '#B07D1A' : o.status === 'preparing' ? 'var(--orange)' : 'var(--green)',
                }}>
                  {getStatusLabel(o.status as any, 'ar')}
                </span>
              </div>
              <div className="order-code-display">{o.pickupCode}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--text-light)', textAlign: 'center', marginBottom: 10 }}>
                {t('partner_pickup_code', lang)}
              </div>
              <div style={{ fontSize: '.82rem', marginBottom: 10 }}>
                <div>👤 <strong>{o.customer}</strong></div>
                <div>☕ <strong>{o.coffeeAr}</strong></div>
                <div>🕐 <strong>{o.time}</strong></div>
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
                    onClick={() => { handleVerify(o.id); setVerifyCodes({ ...verifyCodes, [o.id]: '' }); }}>{t('partner_verify', lang)}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
