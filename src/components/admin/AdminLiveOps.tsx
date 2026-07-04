'use client';
import { useAppStore } from '../../store/useAppStore';
import { updateOrderStatus, addAuditLog } from '../../lib/supabase';
import { t } from '../../i18n';

export default function AdminLiveOps() {
  const { orders, loadFromSupabase, lang } = useAppStore();

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

  return (
    <div className="admin-page" id="apLiveOps">
      <div className="live-ticker">
        <div className="ticker-label">● {t('live_label', lang)}</div>
        <div className="ticker-content">
          <div className="ticker-track">{t('ticker_text', lang).replace('{lastOrder}', 'SB-1046').replace('{totalOrders}', '48').replace('{activeUsers}', '12')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('pending', lang)}</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--amber)' }}>{orders.filter(o => o.status === 'pending').length}</div>
        </div>
        <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('preparing', lang)}</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--blue)' }}>{orders.filter(o => o.status === 'ready').length}</div>
        </div>
      </div>

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
            {orders.map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{o.coffeeAr || t('th_customer', lang)}</td>
                <td>{o.cafe}</td>
                <td>{o.amount.toFixed(2)} ⃁</td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{o.date}</td>
                  <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' ? 'blue' : 'amber'}`}>{t(`status_${o.status}`, lang) || o.status}</span></td>
                <td>
                  <button className="action-btn secondary" style={{ padding: '4px 12px', fontSize: '.72rem', width: 'auto' }} onClick={() => handleAction(o.id, o.status)}>
                    {o.status === 'pending' ? t('btn_prepare', lang) : o.status === 'ready' ? t('btn_deliver', lang) : '—'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
