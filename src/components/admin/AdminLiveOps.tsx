'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, addAuditLog } from '../../lib/supabase';
import { watchAllOrders, updateOrderStatusInFirebase } from '../../lib/firebase';
import { t } from '../../i18n';

export default function AdminLiveOps() {
  const { cafes, lang, currentUser } = useAppStore();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    return watchAllOrders((orders) => setAllOrders(orders));
  }, []);

  const handleAction = async (order: any) => {
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

      <div className="ops-status-grid">
        <div className="ops-stat-card">
          <div className="ops-stat-label">{t('ops_site_status', lang) || (lang === 'ar' ? 'حالة الموقع' : 'Site Status')}</div>
          <div className="ops-stat-value ops-online">● {t('system_online', lang)}</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-label">{lang === 'ar' ? 'مقاهي مفتوحة' : 'Open Cafes'}</div>
          <div className="ops-stat-value ops-green">{activeCafes}</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-label">{lang === 'ar' ? 'مقاهي مغلقة' : 'Closed Cafes'}</div>
          <div className="ops-stat-value ops-red">{closedCafes}</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-label">{lang === 'ar' ? 'قيد التحضير' : 'Preparing'}</div>
          <div className="ops-stat-value ops-amber">{preparing.length}</div>
        </div>
      </div>

      <div className="ops-sub-grid">
        <div className="ops-stat-card">
          <div className="ops-stat-label">{t('ops_pending', lang) || (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}</div>
          <div className="ops-stat-value ops-amber">{pending.length}</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-label">{lang === 'ar' ? 'مكتملة' : 'Completed'}</div>
          <div className="ops-stat-value ops-green">{completed.length}</div>
        </div>
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
            {filtered.slice(0, 30).map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.customerName || o.customer_name || t('th_customer', lang)}</td>
                <td>{o.cafe || o.cafe_name || '-'}</td>
                <td>{o.amount ? `${Number(o.amount).toFixed(2)} ﷼` : o.total_amount ? `${Number(o.total_amount).toFixed(2)} ﷼` : '-'}</td>
                <td style={{ fontSize: '.78rem' }}>{o.date || o.createdAt ? new Date(o.date || o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' || o.status === 'preparing' ? 'blue' : 'amber'}`}>{t(`status_${o.status}`, lang) || o.status}</span></td>
                <td>
                  <button className="action-btn secondary" style={{ padding: '4px 12px', fontSize: '.72rem', width: 'auto' }} onClick={() => handleAction(o)}>
                    {o.status === 'pending' ? t('btn_prepare', lang) : o.status === 'ready' || o.status === 'preparing' ? t('btn_deliver', lang) : '—'}
                  </button>
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
