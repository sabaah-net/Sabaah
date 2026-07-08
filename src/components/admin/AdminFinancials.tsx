'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function AdminFinancials() {
  const { orders, transactions, lang } = useAppStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalVat = orders.reduce((sum, o) => sum + o.vat, 0);
  const revenueAfterVat = totalRevenue - totalVat;

  return (
    <div className="admin-page" id="apFinancials">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>{t('financial_title', lang)}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('total_revenue_card', lang), val: `⃁ ${totalRevenue.toFixed(2)}`, sub: t('from_n_orders', lang).replace('{count}', String(orders.length)), color: 'var(--green)' },
          { label: t('net_revenue', lang), val: `⃁ ${revenueAfterVat.toFixed(2)}`, sub: t('after_vat', lang), color: 'var(--blue)' },
          { label: t('vat_total_card', lang), val: `⃁ ${totalVat.toFixed(2)}`, sub: t('vat_desc', lang), color: 'var(--amber)' },
          { label: t('order_count_card', lang), val: String(orders.length), sub: t('total_orders', lang), color: 'var(--purple)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--foam)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{k.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: k.color, margin: '4px 0' }}>{k.val}</div>
            <div style={{ fontSize: '.72rem', color: k.color }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">{t('transactions_title', lang)}</div>
          <input className="admin-search" placeholder={t('search_placeholder', lang)} />
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>{t('th_date', lang)}</th><th>{t('th_type', lang)}</th><th>{t('th_desc', lang)}</th><th>{t('th_amount', lang)}</th><th>{t('th_vat', lang)}</th><th>{t('th_total', lang)}</th><th>{t('th_status', lang)}</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_transactions', lang)}</td></tr>
            )}
            {orders.map((o, i) => (
              <tr key={i}>
                <td style={{ fontSize: '.78rem' }}>#{o.id}</td>
                <td>{o.date}</td>
                <td><span className="table-badge badge-green">{t('sales_badge', lang)}</span></td>
                <td style={{ fontSize: '.82rem' }}>{t('order_description', lang).replace('{cafe}', o.cafe).replace('{id}', String(o.id))}</td>
                <td><span className="currency-sym">⃁</span>{o.base.toFixed(2)}</td>
                <td><span className="currency-sym">⃁</span>{o.vat.toFixed(2)}</td>
                <td><strong><span className="currency-sym">⃁</span>{o.amount.toFixed(2)}</strong></td>
                <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : 'amber'}`}>{o.status === 'completed' ? t('status_completed', lang) : o.status === 'ready' ? t('status_ready', lang) : t('status_pending', lang)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
