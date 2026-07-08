'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { downloadCSV, downloadJSON, downloadPDF } from '../../lib/export';
import { getSalesSummary, getSalesByCafe, getBestSellingItems, getCustomerSummary, getTopCustomers } from '../../lib/reports';
import { supabase } from '../../lib/supabase';
import type { SalesReportSummary, SalesByCafe, BestSellingItem, CustomerReportSummary, TopCustomer } from '../../types';

type ReportTab = 'sales' | 'customers' | 'site';

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function AdminReports() {
  const { lang } = useAppStore();
  const [tab, setTab] = useState<ReportTab>('sales');
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [byCafe, setByCafe] = useState<SalesByCafe[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellingItem[]>([]);
  const [custSummary, setCustSummary] = useState<CustomerReportSummary | null>(null);
  const [topCust, setTopCust] = useState<TopCustomer[]>([]);
  const [liveOrders, setLiveOrders] = useState<number>(0);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      setLiveOrders(count || 0);

      if (tab === 'sales') {
        const [s, bc, bs] = await Promise.all([
          getSalesSummary(from || undefined, to || undefined),
          getSalesByCafe(from || undefined, to || undefined),
          getBestSellingItems(from || undefined, to || undefined),
        ]);
        setSummary(s);
        setByCafe(bc);
        setBestSellers(bs);
      } else {
        const [cs, tc] = await Promise.all([
          getCustomerSummary(from || undefined, to || undefined),
          getTopCustomers(10, from || undefined, to || undefined),
        ]);
        setCustSummary(cs);
        setTopCust(tc);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'site') fetchSiteData();
    else fetchData();
  }, [tab]);

  const [siteOrders, setSiteOrders] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [siteCafes, setSiteCafes] = useState<any[]>([]);
  const [siteTransactions, setSiteTransactions] = useState<any[]>([]);
  const [siteLoading, setSiteLoading] = useState(false);

  const fetchSiteData = async () => {
    setSiteLoading(true);
    const [ordersRes, usersRes, cafesRes, txnsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('*').limit(500),
      supabase.from('cafes').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (ordersRes.data) setSiteOrders(ordersRes.data);
    if (usersRes.data) setSiteUsers(usersRes.data);
    if (cafesRes.data) setSiteCafes(cafesRes.data);
    if (txnsRes.data) setSiteTransactions(txnsRes.data);
    setSiteLoading(false);
  };

  const exportCSV = async () => {
    await fetchData();
    if (tab === 'sales') {
      downloadCSV(bestSellers.map((b, i) => ({ rank: i + 1, name: b.name, sales: b.sales, revenue: b.revenue })), `sales_report_${from}_${to}`);
      downloadCSV(byCafe.map(b => ({ cafe: b.cafeName, orders: b.orders, revenue: b.revenue })), `sales_by_cafe_${from}_${to}`);
    } else if (tab === 'customers') {
      downloadCSV(topCust.map((c, i) => ({ rank: i + 1, name: c.name, email: c.email, orders: c.orders, totalSpent: c.totalSpent, tier: c.tier })), `customers_report_${from}_${to}`);
    } else {
      await fetchSiteData();
      downloadCSV(siteOrders.map(o => ({ id: o.id, customer: o.customer_name, cafe: o.cafe_name, amount: o.total_amount, status: o.status, date: o.created_at })), `site_orders_${today()}`);
      downloadCSV(siteUsers.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), email: u.email, phone: u.phone, role: u.role, tier: u.loyalty_tier })), `site_users_${today()}`);
      downloadCSV(siteCafes.map(c => ({ id: c.id, name_ar: c.name_ar, name_en: c.name_en, status: c.status, isOpen: c.isOpen })), `site_cafes_${today()}`);
    }
  };

  const exportJSON = async () => {
    await fetchData();
    if (tab === 'sales') {
      downloadJSON({ summary, byCafe, bestSellers }, `sales_report_${from}_${to}`);
    } else if (tab === 'customers') {
      downloadJSON({ summary: custSummary, topCustomers: topCust }, `customers_report_${from}_${to}`);
    } else {
      await fetchSiteData();
      downloadJSON({ orders: siteOrders, users: siteUsers, cafes: siteCafes, transactions: siteTransactions }, `site_data_${today()}`);
    }
  };

  const exportPDF = async () => {
    await fetchData();
    const dateLabel = `${from} → ${to}`;
    if (tab === 'sales' && summary) {
      const kpiTables = {
        caption: t('report_summary', lang) || 'Summary',
        headers: [t('report_total_orders', lang), t('report_total_revenue', lang), t('report_net_revenue', lang), t('report_avg_order', lang), 'VAT'],
        rows: [[
          String(summary.totalOrders),
          `${summary.totalRevenue.toFixed(2)} SAR`,
          `${summary.netRevenue.toFixed(2)} SAR`,
          `${summary.avgOrderValue.toFixed(2)} SAR`,
          `${summary.totalVat.toFixed(2)} SAR`,
        ]],
      };
      const bestTables = bestSellers.length > 0 ? {
        caption: t('report_best_selling', lang),
        headers: ['#', t('th_drink', lang), t('th_sales', lang), t('th_revenue', lang)],
        rows: bestSellers.slice(0, 15).map((b, i) => [`#${i + 1}`, b.name, String(b.sales), `${b.revenue.toFixed(2)} SAR`]),
      } : null;
      const cafeTables = byCafe.length > 0 ? {
        caption: t('report_by_cafe', lang),
        headers: [t('th_rank', lang), t('th_name', lang), t('th_sales', lang), t('th_revenue', lang), t('th_percentage', lang)],
        rows: byCafe.map((c, i) => [`#${i + 1}`, c.cafeName, String(c.orders), `${c.revenue.toFixed(2)} SAR`, `${summary.totalRevenue > 0 ? ((c.revenue / summary.totalRevenue) * 100).toFixed(1) : '0'}%`]),
      } : null;

      downloadPDF(`Sales Report ${dateLabel}`, [kpiTables, ...(bestTables ? [bestTables] : []), ...(cafeTables ? [cafeTables] : [])]);
    } else if (tab === 'customers' && custSummary) {
      const kpiTables = {
        caption: t('report_customer_summary', lang) || 'Customer Summary',
        headers: [t('report_customer_total', lang), t('report_customer_active', lang), t('report_customer_new', lang)],
        rows: [[String(custSummary.total), String(custSummary.active), String(custSummary.newThisPeriod)]],
      };
      const tierTables = custSummary.byTier.length > 0 ? {
        caption: t('admin_tiers', lang) || 'Loyalty Tiers',
        headers: [t('th_tier', lang) || 'Tier', t('th_count', lang) || 'Count', '%'],
        rows: custSummary.byTier.map(t => [t.tier, String(t.count), `${custSummary.total > 0 ? ((t.count / custSummary.total) * 100).toFixed(1) : '0'}%`]),
      } : null;
      const topTables = topCust.length > 0 ? {
        caption: t('report_top_customers', lang),
        headers: ['#', t('th_name', lang), t('th_email', lang), t('th_sales', lang), t('th_revenue', lang), t('th_tier', lang)],
        rows: topCust.map((c, i) => [`#${i + 1}`, c.name, c.email, String(c.orders), `${c.totalSpent.toFixed(2)} SAR`, c.tier]),
      } : null;

      downloadPDF(`Customer Report ${dateLabel}`, [kpiTables, ...(tierTables ? [tierTables] : []), ...(topTables ? [topTables] : [])]);
    } else if (tab === 'site') {
      await fetchSiteData();
      const ordersTable = {
        caption: lang === 'ar' ? 'الطلبات' : 'Orders',
        headers: ['ID', 'Customer', 'Cafe', 'Amount', 'Status', 'Date'],
        rows: siteOrders.slice(0, 100).map(o => [o.id?.slice(0, 8), o.customer_name || '-', o.cafe_name || '-', `${o.total_amount || 0} SAR`, o.status || '-', o.created_at?.slice(0, 10) || '-']),
      };
      const usersTable = {
        caption: lang === 'ar' ? 'المستخدمين' : 'Users',
        headers: ['Name', 'Email', 'Role', 'Tier'],
        rows: siteUsers.slice(0, 50).map(u => [`${u.first_name || ''} ${u.last_name || ''}`.trim(), u.email || '-', u.role || '-', u.loyalty_tier || '-']),
      };
      downloadPDF(`Site Data ${today()}`, [ordersTable, usersTable]);
    }
  };

  return (
    <div className="admin-page" id="apReports">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>📄 {t('admin_reports', lang)}</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="admin-tabs" style={{ display: 'flex', gap: 0 }}>
          {(['sales', 'customers', 'site'] as ReportTab[]).map((rt) => (
            <button key={rt} className={`btn-tab ${tab === rt ? 'active' : ''}`} onClick={() => setTab(rt)}>
              {rt === 'sales' ? '📊' : rt === 'customers' ? '👥' : '📦'} {rt === 'site' ? (lang === 'ar' ? 'الموقع كامل' : 'Site Data') : t(rt === 'sales' ? 'report_sales' : 'report_customers', lang)}
            </button>
          ))}
        </div>
        {tab !== 'site' && (
          <>
            <input type="date" className="coffee-input" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span style={{ color: 'var(--text-light)' }}>{t('report_date_to', lang)}</span>
            <input type="date" className="coffee-input" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} />
            <button className="action-btn primary" style={{ width: 'auto', padding: '7px 18px', fontSize: '.8rem' }} onClick={fetchData}>
              🔄 {t('report_filter', lang)}
            </button>
          </>
        )}

        <div style={{ width: 1, height: 28, background: 'var(--latte)' }} />

        <button className="action-btn secondary" style={{ width: 'auto', padding: '7px 14px', fontSize: '.78rem' }} onClick={exportCSV}>
          📥 CSV
        </button>
        <button className="action-btn secondary" style={{ width: 'auto', padding: '7px 14px', fontSize: '.78rem' }} onClick={exportJSON}>
          📥 JSON
        </button>
        <button className="action-btn secondary" style={{ width: 'auto', padding: '7px 14px', fontSize: '.78rem' }} onClick={exportPDF}>
          📄 {t('report_export_pdf', lang) || 'PDF'}
        </button>
      </div>

      <div style={{ background: 'var(--foam)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{t('live_orders_label', lang) || 'Live Orders'}</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--green)' }}>{liveOrders.toLocaleString('en-US')}</span>
      </div>

      {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '.85rem' }}>{error}</div>}

      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>{t('report_loading', lang)}</p>}

      {!loading && tab === 'sales' && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: t('report_total_orders', lang), val: summary.totalOrders.toLocaleString('en-US'), color: 'var(--green)' },
              { label: t('report_total_revenue', lang), val: `﷼ ${summary.totalRevenue.toFixed(2)}`, color: 'var(--blue)' },
              { label: t('report_net_revenue', lang), val: `﷼ ${summary.netRevenue.toFixed(2)}`, color: 'var(--purple)' },
              { label: t('report_avg_order', lang), val: `﷼ ${summary.avgOrderValue.toFixed(2)}`, color: 'var(--amber)' },
              { label: 'VAT', val: `﷼ ${summary.totalVat.toFixed(2)}`, color: 'var(--red)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{k.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: k.color, margin: '4px 0' }}>{k.val}</div>
              </div>
            ))}
          </div>

          {bestSellers.length > 0 && (
            <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
              <div className="admin-table-header">
                <div className="admin-table-title">{t('report_best_selling', lang)}</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>{t('th_drink', lang)}</th><th>{t('th_sales', lang)}</th><th>{t('th_revenue', lang)}</th><th>{t('report_by_cafe', lang)}</th></tr></thead>
                <tbody>
                  {bestSellers.slice(0, 15).map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: i < 3 ? 'var(--amber)' : 'var(--text-light)' }}>#{i + 1}</td>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.sales.toLocaleString('en-US')}</td>
                      <td><span className="currency-sym">﷼</span>{item.revenue.toFixed(2)}</td>
                      <td style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>{item.cafeName}</td>
                    </tr>
                  ))}
                  {bestSellers.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('report_no_data', lang)}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {byCafe.length > 0 && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">{t('report_by_cafe', lang)}</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>{t('th_rank', lang)}</th><th>{t('th_name', lang)}</th><th>{t('th_sales', lang)}</th><th>{t('th_revenue', lang)}</th><th>{t('th_percentage', lang)}</th></tr></thead>
                <tbody>
                  {byCafe.map((cafe, i) => {
                    const pct = summary.totalRevenue > 0 ? ((cafe.revenue / summary.totalRevenue) * 100).toFixed(1) : '0';
                    return (
                      <tr key={cafe.cafeId}>
                        <td style={{ fontWeight: 800, color: i < 3 ? 'var(--amber)' : 'var(--text-light)' }}>#{i + 1}</td>
                        <td><strong>{cafe.cafeName}</strong></td>
                        <td>{cafe.orders.toLocaleString('en-US')}</td>
                        <td><span className="currency-sym">﷼</span>{cafe.revenue.toFixed(2)}</td>
                        <td><span className="table-badge badge-green">{pct}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'site' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{lang === 'ar' ? 'الطلبات' : 'Orders'}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--blue)', margin: '4px 0' }}>{siteOrders.length.toLocaleString('en-US')}</div>
            </div>
            <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{lang === 'ar' ? 'المستخدمين' : 'Users'}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--green)', margin: '4px 0' }}>{siteUsers.length.toLocaleString('en-US')}</div>
            </div>
            <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{lang === 'ar' ? 'المقاهي' : 'Cafes'}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)', margin: '4px 0' }}>{siteCafes.length.toLocaleString('en-US')}</div>
            </div>
            <div style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{lang === 'ar' ? 'المعاملات' : 'Transactions'}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--purple)', margin: '4px 0' }}>{siteTransactions.length.toLocaleString('en-US')}</div>
            </div>
          </div>
          {siteLoading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>{t('report_loading', lang)}</p>}
          {!siteLoading && (
            <>
              {siteOrders.length > 0 && (
                <div className="admin-table-wrap" style={{ marginBottom: 12 }}>
                  <div className="admin-table-header">
                    <div className="admin-table-title">{lang === 'ar' ? 'أحدث الطلبات' : 'Recent Orders'}</div>
                  </div>
                  <table className="admin-table">
                    <thead><tr><th>ID</th><th>{t('th_customer', lang)}</th><th>{t('th_cafe', lang)}</th><th>{t('th_amount', lang)}</th><th>{t('th_status', lang)}</th><th>{t('th_date', lang)}</th></tr></thead>
                    <tbody>
                      {siteOrders.slice(0, 20).map((o, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: '.75rem', fontFamily: 'monospace' }}>#{o.id?.slice(0, 8)}</td>
                          <td>{o.customer_name || '-'}</td>
                          <td>{o.cafe_name || '-'}</td>
                          <td><span className="currency-sym">﷼</span>{Number(o.total_amount || 0).toFixed(2)}</td>
                          <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' ? 'blue' : 'amber'}`}>{o.status || '-'}</span></td>
                          <td style={{ fontSize: '.75rem' }}>{o.created_at?.slice(0, 10) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!loading && tab === 'customers' && custSummary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: t('report_customer_total', lang), val: custSummary.total.toLocaleString('en-US'), color: 'var(--blue)' },
              { label: t('report_customer_active', lang), val: custSummary.active.toLocaleString('en-US'), color: 'var(--green)' },
              { label: t('report_customer_new', lang), val: custSummary.newThisPeriod.toLocaleString('en-US'), color: 'var(--amber)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--foam)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>{k.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: k.color, margin: '4px 0' }}>{k.val}</div>
              </div>
            ))}
          </div>

          {custSummary.byTier.length > 0 && (
            <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
              <div className="admin-table-header">
                <div className="admin-table-title">{t('admin_tiers', lang) || 'Loyalty Tiers'}</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>{t('th_tier', lang) || 'Tier'}</th><th>{t('th_count', lang) || 'Count'}</th><th>{t('th_percentage', lang) || '%'}</th></tr></thead>
                <tbody>
                  {custSummary.byTier.map((tier) => (
                    <tr key={tier.tier}>
                      <td><span className="table-badge badge-blue">{tier.tier}</span></td>
                      <td>{tier.count.toLocaleString('en-US')}</td>
                      <td>{custSummary.total > 0 ? ((tier.count / custSummary.total) * 100).toFixed(1) : '0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {topCust.length > 0 && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <div className="admin-table-title">{t('report_top_customers', lang)}</div>
              </div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>{t('th_name', lang)}</th><th>{t('th_email', lang)}</th><th>{t('th_sales', lang)}</th><th>{t('th_revenue', lang)}</th><th>{t('th_tier', lang)}</th></tr></thead>
                <tbody>
                  {topCust.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800 }}>#{i + 1}</td>
                      <td><strong>{c.name}</strong></td>
                      <td style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>{c.email}</td>
                      <td>{c.orders}</td>
                      <td><span className="currency-sym">﷼</span>{c.totalSpent.toFixed(2)}</td>
                      <td><span className={`table-badge badge-${c.tier === 'platinum' ? 'purple' : c.tier === 'gold' ? 'amber' : 'green'}`}>{c.tier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab !== 'site' && !loading && !summary && !custSummary && !error && (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>{t('report_no_data', lang)}</p>
      )}
    </div>
  );
}
