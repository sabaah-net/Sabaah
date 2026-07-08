'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getStatusLabel, getStatusClass, t } from '../../i18n';

export default function HistoryPage() {
  const store = useAppStore();
  const [tab, setTab] = useState<'orders' | 'transactions'>('orders');

  const handleReorder = (order: typeof store.orders[number]) => {
    const cafe = store.cafes.find((c) => c.name === order.cafe);
    if (cafe) {
      store.setSelectedCafe(cafe);
      if (order.items && order.items.length > 0) {
        store.setCart(order.items.map((item) => ({
          type: item.type,
          qty: item.qty,
          price: item.price,
          name: item.name,
          icon: item.icon,
        })));
      }
    }
  };

  const shortId = (id?: string | null) => {
    const value = (id || '').toString();
    return value.length > 8 ? value.slice(0, 8) : value || '--------';
  };

  return (
    <div id="pageHistory">
      <div className="history-pills">
        <button
          className={`history-pill ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          {t('order_history_title', store.lang)}
        </button>
        <button
          className={`history-pill ${tab === 'transactions' ? 'active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          {t('recent_txns', store.lang)}
        </button>
      </div>

      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {store.orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)', fontSize: '.85rem' }}>
              {store.lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}
            </div>
          )}
          {store.orders.map((o, idx) => (
            <div key={`${o.id}-${idx}`} className="order-card">
              <div className="order-card-top">
                <div className="order-id">{t('code_label', store.lang)} <strong>{shortId(o.pickupCode || o.id)}</strong></div>
                <div className="order-date">{o.date}</div>
              </div>
              <div>
                <span className={`order-status ${getStatusClass(o.status)}`}>
                  {getStatusLabel(o.status, store.lang)}
                </span>
              </div>
              <div className="order-items">
                {(o.items && o.items.length > 0
                  ? o.items
                  : [{ icon: o.icon, name: store.lang === 'ar' ? o.coffeeAr : o.coffee, qty: 1 }]
                ).map((item, i) => (
                  <span key={i} className="order-item-chip">
                    {item.icon} {item.name}{item.qty > 1 ? ` x${item.qty}` : ''}
                  </span>
                ))}
              </div>
              <div className="order-card-bottom">
                <div className="order-total">
                  <span className="currency-sym">⃁</span>{(o.amount || 0).toFixed(2)}
                </div>
                <button className="reorder-btn" title={t('reorder_label', store.lang) || 'Reorder'} onClick={() => handleReorder(o)}>
                  ↻
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {store.transactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)', fontSize: '.85rem' }}>
              {store.lang === 'ar' ? 'لا توجد معاملات' : 'No transactions'}
            </div>
          )}
          {store.transactions.map((txn, i) => (
            <div key={i} className="txn-card">
              <div className={`txn-icon ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                {txn.type === 'credit' ? '💰' : '💳'}
              </div>
              <div className="txn-body">
                <div className="txn-title">{store.lang === 'ar' ? txn.title : txn.titleEn}</div>
                <div className="txn-date">{txn.date}</div>
              </div>
              <div className={`txn-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                {txn.type === 'credit' ? '+' : ''}
                <span className="currency-sym">⃁</span>{txn.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
