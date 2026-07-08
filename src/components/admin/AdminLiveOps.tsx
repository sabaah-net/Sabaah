'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, addAuditLog } from '../../lib/supabase';
import { watchAllOrders, updateOrderStatusInFirebase } from '../../lib/firebase';
import { t } from '../../i18n';

export default function AdminLiveOps() {
  const { cafes, lang, currentUser, role } = useAppStore();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    return watchAllOrders((orders) => setAllOrders(orders));
  }, []);

  const canAct = !viewOnly && role === 'superadmin';

  const handleAction = async (order: any) => {
    if (!canAct) return;
    try {
      const nextStatus = order.status === 'pending' ? 'ready' : order.status === 'ready' ? 'completed' : order.status;
      const uid = order.userId;
      if (uid) updateOrderStatusInFirebase(uid, order.id, nextStatus);
      try {
        await supabase.from('orders').update({ status: nextStatus }).eq('order_number', order.order_number || order.id);
      } catch {}
      await addAuditLog({
        user_name: currentUser?.name || t('audit_supervisor', lang),
        action_ar: `${t('update_order_status', lang)} #${order.id} ${t('to_status', lang)} ${nextStatus}`,
        action_type: 'order',
        details: `${order.status} → ${nextStatus}`,
      });
    } catch (e) {
      console.error('Failed to update order:', e);
    }
  };

  const pending = allOrders.filter(o => o.status === 'pending');
  const preparing = allOrders.filter(o => o.status === 'ready' || o.status === 'preparing');
  const completed = allOrders.filter(o => o.status === 'completed');
  const activeCafes = cafes.filter(c => c.isOpen).length;
  const closedCafes = cafes.filter(c => !c.isOpen).length;

  const filtered = filter
    ? allOrders.filter((o) =>
        (o.id || '').toLowerCase().includes(filter.toLowerCase()) ||
        (o.customerName || o.customer_name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (o.cafe || o.cafe_name || '').toLowerCase().includes(filter.toLowerCase())
      )
    : allOrders;

  return (
    <div className="admin-page" id="apLiveOps">
      <div className="live-ticker">
        <div className="ticker-label">● {t('live_label', lang)}</div>
        <div className="ticker-content">
          <div className="ticker-track">{t('ticker_text', lang).replace('{lastOrder}', allOrders[0]?.id || '—').replace('{totalOrders}', String(allOrders.length)).replace('{activeUsers}', '12')}</div>
        </div>
      </div>

      <div className="ops-stats-container">
        <div className="ops-stat-row">
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('ops_site_status', lang)}</div>
            <div className="ops-stat-value ops-online">● {t('system_online', lang)}</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('open_cafes_label', lang)}</div>
            <div className="ops-stat-value ops-green">{activeCafes}</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('closed_cafes_label', lang)}</div>
            <div className="ops-stat-value ops-red">{closedCafes}</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('preparing_label', lang)}</div>
            <div className="ops-stat-value ops-amber">{preparing.length}</div>
          </div>
        </div>
        <div className="ops-stat-row">
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('pending', lang)}</div>
            <div className="ops-stat-value ops-amber">{pending.length}</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-label">{t('completed_label', lang)}</div>
            <div className="ops-stat-value ops-green">{completed.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '.72rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <label className="ios-switch" style={{ transform: 'scale(.7)', transformOrigin: 'right center' }}>
            <input type="checkbox" checked={viewOnly} onChange={() => setViewOnly(!viewOnly)} />
            <span className="slider" style={{ background: viewOnly ? 'var(--green)' : 'var(--latte)' }} />
          </label>
          {viewOnly ? (lang === 'ar' ? 'عرض فقط' : 'View Only') : (lang === 'ar' ? 'تحكم كامل' : 'Full Control')}
        </span>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">🚨 {t('ops_desk', lang)}</div>
          <input className="admin-search" placeholder={t('quick_search', lang)} value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>{t('th_order', lang)}</th><th>{t('th_customer', lang)}</th><th>{t('th_cafe', lang)}</th><th>{t('th_amount', lang)}</th><th>{t('th_time', lang)}</th><th>{t('th_status', lang)}</th><th>{t('th_action', lang)}</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map((o, idx) => (
              <tr key={`${o.id}-${idx}`}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.customerName || o.customer_name || t('th_customer', lang)}</td>
                <td>{o.cafe || o.cafe_name || '-'}</td>
                <td>{o.amount ? <>{Number(o.amount).toFixed(2)}<span className="currency-sym">﷼</span></> : o.total_amount ? <>{Number(o.total_amount).toFixed(2)}<span className="currency-sym">﷼</span></> : '-'}</td>
                <td style={{ fontSize: '.78rem' }}>{o.date || o.createdAt ? new Date(o.date || o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' || o.status === 'preparing' ? 'blue' : 'amber'}`}>{t(`status_${o.status}`, lang) || o.status}</span></td>
                <td>
                  {canAct ? (
                    <button className="action-btn secondary" style={{ padding: '4px 12px', fontSize: '.72rem', width: 'auto' }} onClick={() => handleAction(o)}>
                      {o.status === 'pending' ? t('btn_prepare', lang) : o.status === 'ready' || o.status === 'preparing' ? t('btn_deliver', lang) : '—'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{lang === 'ar' ? '—' : '—'}</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{lang === 'ar' ? '✅ لا توجد طلبات' : '✅ No orders'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
