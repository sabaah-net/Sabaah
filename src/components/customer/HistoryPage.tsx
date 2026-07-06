'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getStatusLabel, t } from '../../i18n';

export default function HistoryPage() {
  const store = useAppStore();
  const [tab, setTab] = useState<'orders' | 'transactions'>('orders');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const orderDays = store.orders.map((o) => new Date(o.date).getDate());

  const monthLabel = new Date(calYear, calMonth).toLocaleString(
    'en-US',
    { month: 'long', year: 'numeric' }
  );

  return (
    <div id="pageHistory">
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`btn-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          📋 {t('order_history_title', store.lang)}
        </button>
        <button className={`btn-tab ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
          💳 {t('recent_txns', store.lang)}
        </button>
      </div>

      {tab === 'orders' && <><p className="section-title">{t('order_history_title', store.lang)}</p>

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
              <div style={{ fontSize: '.88rem', fontWeight: 900, color: 'var(--amber)' }}>⃁ {(o.amount || 0).toFixed(2)}</div>
              <div style={{ fontSize: '.63rem', color: 'var(--text-light)' }}>
                {t('code_label', store.lang)} <strong style={{ color: 'var(--bark)' }}>{o.pickupCode || '----'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="section-title" style={{ marginTop: 16 }}>{t('calendar_title', store.lang)}</p>
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
          {[t('day_short_sun', store.lang), t('day_short_mon', store.lang), t('day_short_tue', store.lang), t('day_short_wed', store.lang), t('day_short_thu', store.lang), t('day_short_fri', store.lang), t('day_short_sat', store.lang)].map((d) => (
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
      </>}

      {tab === 'transactions' && (
        <>
          <p className="section-title">💳 {t('recent_txns', store.lang)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {store.transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)', fontSize: '.85rem' }}>{t('no_transactions', store.lang) || 'No transactions'}</div>
            )}
            {store.transactions.map((txn, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 12px',
                boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: txn.type === 'credit' ? 'var(--green-bg)' : 'var(--red-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {txn.type === 'credit' ? '💰' : '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700 }}>
                    {store.lang === 'ar' ? txn.title : txn.titleEn}
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text-light)' }}>{txn.date}</div>
                </div>
                <div style={{
                  fontSize: '.88rem', fontWeight: 900,
                  color: txn.type === 'credit' ? 'var(--green)' : 'var(--red)',
                  flexShrink: 0,
                }}>
                  {txn.type === 'credit' ? '+' : ''}⃁ {txn.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
