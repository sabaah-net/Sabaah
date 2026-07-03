'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getStatusLabel } from '../../i18n';

export default function HistoryPage() {
  const store = useAppStore();
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const orderDays = store.orders.map((o) => new Date(o.date).getDate());

  const monthLabel = new Date(calYear, calMonth).toLocaleString(
    store.lang === 'ar' ? 'ar-SA' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  return (
    <div id="pageHistory">
      <p className="section-title">📋 سجل الطلبات</p>

      <div id="customerHistoryList">
        {store.orders.map((o) => (
          <div
            key={o.id}
            style={{
              background: '#fff', borderRadius: 'var(--r-md)', padding: '12px 14px',
              boxShadow: 'var(--sh-sm)', marginBottom: 9, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer',
            }}
          >
            <div style={{
              fontSize: '1.4rem', width: 40, height: 40, background: 'var(--latte)',
              borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {o.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.88rem', fontWeight: 700 }}>{o.cafe} - {store.lang === 'ar' ? o.coffeeAr : o.coffee}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)', marginTop: 1 }}>{o.date}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--green)', marginTop: 2, fontWeight: 700 }}>
                {getStatusLabel(o.status, store.lang)}
              </div>
            </div>
            <div style={{ textAlign: 'left', flexShrink: 0 }}>
              <div style={{ fontSize: '.88rem', fontWeight: 900, color: 'var(--amber)' }}>{o.amount.toFixed(2)} ⃁</div>
              <div style={{ fontSize: '.63rem', color: 'var(--text-light)' }}>
                كود: <strong style={{ color: 'var(--bark)' }}>{o.pickupCode || '----'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="section-title" style={{ marginTop: 16 }}>📅 التقويم</p>
      <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.7rem' }}
            onClick={() => {
              const m = calMonth - 1;
              if (m < 0) { setCalMonth(11); setCalYear(calYear - 1); }
              else setCalMonth(m);
            }}
          >◀</button>
          <strong style={{ fontSize: '.9rem' }}>{monthLabel}</strong>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.7rem' }}
            onClick={() => {
              const m = calMonth + 1;
              if (m > 11) { setCalMonth(0); setCalYear(calYear + 1); }
              else setCalMonth(m);
            }}
          >▶</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {['أحد', 'إثن', 'ثل', 'أر', 'خم', 'جم', 'سب'].map((d) => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const hasOrder = orderDays.includes(d);
            return (
              <div key={d} className={`cal-day ${hasOrder ? 'has-order' : ''}`}>{d}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
