'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, updateOrderStatus, addAuditLog } from '../../lib/supabase';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../lib/firebase';
import { t } from '../../i18n';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  cafe_name: string;
  total_amount: number;
  status: string;
  pickup_code: string;
  created_at: string;
  payment_method: string;
}

export default function AdminLiveOps() {
  const { orders, cafes, loadFromSupabase, lang } = useAppStore();
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const r = ref(db, 'orders');
    const fn = onValue(r, (snap) => {
      const val: Record<string, any> = snap.val() || {};
      const list: OrderRow[] = [];
      for (const uid of Object.keys(val)) {
        for (const oid of Object.keys(val[uid])) {
          list.push({ id: oid, ...val[uid][oid] });
        }
      }
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllOrders(list);
    });
    return () => off(r, 'value', fn);
  }, []);

  const handleAction = async (orderId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'pending' ? 'ready' : currentStatus === 'ready' ? 'completed' : currentStatus;
      await updateOrderStatus(orderId, nextStatus);
      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `${t('update_order_status', lang)} #${orderId} ${t('to_status', lang)} ${nextStatus}`,
        action_type: 'order',
        details: `${t(`status_${currentStatus}`, lang) || currentStatus} → ${t(`status_${nextStatus}`, lang) || nextStatus}`,
      });
      await loadFromSupabase();
    } catch (e) {
      console.error('Failed to update order:', e);
    }
  };

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };
  const activeCafes = cafes.filter(c => c.isOpen).length;
  const closedCafes = cafes.filter(c => !c.isOpen).length;

  const filtered = filter
    ? allOrders.filter((o) =>
        (o.order_number || o.id).toLowerCase().includes(filter.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (o.cafe_name || '').toLowerCase().includes(filter.toLowerCase())
      )
    : allOrders;

  return (
    <div className="admin-page" id="apLiveOps">
      {/* Live ticker */}
      <div className="live-ticker">
        <div className="ticker-label">● {t('live_label', lang)}</div>
        <div className="ticker-content">
          <div className="ticker-track">{t('ticker_text', lang).replace('{lastOrder}', 'SB-1046').replace('{totalOrders}', String(orders.length)).replace('{activeUsers}', '12')}</div>
        </div>
      </div>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{lang === 'ar' ? 'حالة الموقع' : 'Site Status'}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: 4, color: 'var(--green)' }}>
            ● {t('system_online', lang)}
          </div>
        </div>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{lang === 'ar' ? 'مقاهي مفتوحة' : 'Open Cafes'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 2, color: 'var(--green)' }}>{activeCafes}</div>
        </div>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{lang === 'ar' ? 'مقاهي مغلقة' : 'Closed Cafes'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 2, color: 'var(--red)' }}>{closedCafes}</div>
        </div>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{lang === 'ar' ? 'قيد التحضير' : 'Preparing'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 2, color: 'var(--amber)' }}>{statusCounts.preparing}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{t('pending', lang)}</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--amber)' }}>{statusCounts.pending}</div>
        </div>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{lang === 'ar' ? 'مكتملة' : 'Completed'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)' }}>{statusCounts.completed}</div>
        </div>
      </div>

      {/* Ops Desk */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">{t('ops_desk', lang)}</div>
          <input className="admin-search" placeholder={t('quick_search', lang)} />
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>{t('th_order', lang)}</th><th>{t('th_customer', lang)}</th><th>{t('th_cafe', lang)}</th><th>{t('th_amount', lang)}</th><th>{t('th_time', lang)}</th><th>{t('th_status', lang)}</th><th>{t('th_action', lang)}</th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 20).map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.coffeeAr || t('th_customer', lang)}</td>
                <td>{o.cafe}</td>
                <td>{o.amount.toFixed(2)} ⃁</td>
                <td style={{ fontSize: '.78rem' }}>{o.date}</td>
                  <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' ? 'blue' : 'amber'}`}>{t(`status_${o.status}`, lang) || o.status}</span></td>
                <td>
                  <button className="action-btn secondary" style={{ padding: '4px 12px', fontSize: '.72rem', width: 'auto' }} onClick={() => handleAction(o.id, o.status)}>
                    {o.status === 'pending' ? t('btn_prepare', lang) : o.status === 'ready' ? t('btn_deliver', lang) : '—'}
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>{lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* All Orders */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800 }}>
            {lang === 'ar' ? 'جميع الطلبات' : 'All Orders'}
          </div>
          <input
            className="coffee-input"
            style={{ width: 220, margin: 0 }}
            placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>{lang === 'ar' ? 'الطلب' : 'Order'}</th><th>{lang === 'ar' ? 'العميل' : 'Customer'}</th><th>{lang === 'ar' ? 'المقهى' : 'Cafe'}</th><th>{lang === 'ar' ? 'المبلغ' : 'Amount'}</th><th>{lang === 'ar' ? 'الدفع' : 'Payment'}</th><th>{lang === 'ar' ? 'الحالة' : 'Status'}</th><th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>{lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}</td></tr>
              )}
              {filtered.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td><strong>{o.order_number || o.id}</strong></td>
                  <td>{o.customer_name || '-'}</td>
                  <td>{o.cafe_name || '-'}</td>
                  <td>{o.total_amount ? `${Number(o.total_amount).toFixed(2)} ⃁` : '-'}</td>
                  <td><span className="table-badge badge-amber">{o.payment_method || '-'}</span></td>
                  <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'pending' ? 'amber' : 'blue'}`}>{o.status}</span></td>
                  <td style={{ fontSize: '.78rem' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}