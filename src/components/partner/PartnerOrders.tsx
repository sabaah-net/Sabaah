'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getStatusLabel } from '../../i18n';

export default function PartnerOrders() {
  const store = useAppStore();
  const [verifyCodes, setVerifyCodes] = useState<Record<string, string>>({});

  const handleVerify = (id: string) => {
    const orders = useAppStore.getState().partnerOrders;
    const order = orders.find((o) => o.id === id);
    const code = verifyCodes[id]?.toUpperCase();
    if (order && code === order.pickupCode) {
      const updated = orders.map(o => o.id === id ? { ...o, status: 'completed' as const } : o);
      useAppStore.setState({ partnerOrders: updated });
    }
  };

  return (
    <div>
      <p className="section-title">📋 الطلبات الحالية</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {store.partnerOrders.map((o) => (
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
                {getStatusLabel(o.status, 'ar')}
              </span>
            </div>
            <div className="order-code-display">{o.pickupCode}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-light)', textAlign: 'center', marginBottom: 10 }}>
              🔑 كود الاستلام - اطلبه من العميل
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
                  placeholder="أدخل كود الاستلام"
                  style={{ margin: 0, textAlign: 'center', letterSpacing: 3, fontWeight: 900 }}
                  value={verifyCodes[o.id] || ''}
                  onChange={(e) => setVerifyCodes({ ...verifyCodes, [o.id]: e.target.value })}
                />
                <button className="action-btn green-btn" style={{ width: 'auto', padding: '0 16px', fontSize: '.8rem' }}
                  onClick={() => handleVerify(o.id)}>تحقق ✅</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
