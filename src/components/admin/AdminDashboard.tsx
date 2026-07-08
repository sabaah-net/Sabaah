'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

function drawBarChart(canvas: HTMLCanvasElement | null, data: number[], labels: string[], colors: string[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const padding = 30;
  const barWidth = (w - padding * 2) / data.length - 8;
  const max = Math.max(...data);
  ctx.clearRect(0, 0, w, h);
  data.forEach((val, i) => {
    const barHeight = (val / max) * (h - padding * 2);
    const x = padding + i * (barWidth + 8) + 4;
    const y = h - padding - barHeight;
    const grad = ctx!.createLinearGradient(0, y, 0, h - padding);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1] || colors[0]);
    ctx!.fillStyle = grad;
    ctx!.beginPath();
    ctx!.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0] as unknown as number);
    ctx!.fill();
    ctx!.fillStyle = '#9B7B68';
    ctx!.font = '600 10px Cairo';
    ctx!.textAlign = 'center';
    ctx!.fillText(labels[i], x + barWidth / 2, h - 10);
    ctx!.fillStyle = '#1C110C';
    ctx!.font = '700 11px Inter';
    ctx!.fillText(String(val), x + barWidth / 2, y - 6);
  });
}

export default function AdminDashboard() {
  const store = useAppStore();
  const { lang } = useAppStore();
  const ordersCanvasRef = useRef<HTMLCanvasElement>(null);
  const revenueCanvasRef = useRef<HTMLCanvasElement>(null);

  const totalOrders = store.orders.length;
  const totalRevenue = store.orders.reduce((sum, o) => sum + o.amount, 0);
  const todayOrders = store.orders.filter(o => o.date.includes('2026-06-13')).length;
  const todayRevenue = store.orders.filter(o => o.date.includes('2026-06-13')).reduce((sum, o) => sum + o.amount, 0);
  const activeUsers = store.users.filter(u => u.status === 'active').length;

  const kpis = [
    { label: t('kpi_total_revenue', lang), val: `⃁ ${totalRevenue.toFixed(2)}`, color: 'green', icon: '💰', delta: '▲ 12%' },
    { label: t('kpi_revenue_today', lang), val: `⃁ ${todayRevenue.toFixed(2)}`, color: 'amber', icon: '📈', delta: '▲ 8%' },
    { label: t('kpi_orders_today', lang), val: String(todayOrders), color: 'blue', icon: '📦', delta: '▲ 15%' },
    { label: t('kpi_active_users', lang), val: String(activeUsers), color: 'purple', icon: '👥', delta: '▲ 5%' },
  ];

  const chartData = [todayOrders || 5, 8, 12, 15, 10, 18, 14];
  const revenueData = [todayRevenue || 40, 65, 95, 120, 80, 140, 110];

  const dayLabels = [t('day_sat', lang), t('day_sun', lang), t('day_mon', lang), t('day_tue', lang), t('day_wed', lang), t('day_thu', lang), t('day_fri', lang)];

  useEffect(() => {
    drawBarChart(ordersCanvasRef.current, chartData, dayLabels, ['#C0692A', '#E5924B']);
    drawBarChart(revenueCanvasRef.current, revenueData, dayLabels, ['#2A7A52', '#4aaa7a']);
  }, [lang]);

  const tickerText = t('ticker_text', lang)
    .replace('{lastOrder}', store.orders[0]?.id || '—')
    .replace('{totalOrders}', String(store.orders.length))
    .replace('{activeUsers}', String(activeUsers));

  return (
    <div className="admin-page active" id="apDashboard">
      <div className="live-ticker">
        <div className="ticker-label">● {t('live_label', lang)}</div>
        <div className="ticker-content">
          <div className="ticker-track">{tickerText}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginBottom: 4 }}>{lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--bark)' }}>{totalOrders}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginBottom: 4 }}>{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--green)' }}><span className="currency-sym">⃁</span>{totalRevenue.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginBottom: 4 }}>{lang === 'ar' ? 'طلبات اليوم' : "Today's Orders"}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>{todayOrders}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginBottom: 4 }}>{lang === 'ar' ? 'إيرادات اليوم' : "Today's Revenue"}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}><span className="currency-sym">⃁</span>{todayRevenue.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginBottom: 4 }}>{lang === 'ar' ? 'المستخدمين النشطين' : 'Active Users'}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--blue)' }}>{activeUsers}</div>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val">{k.val}</div>
            <div className={`kpi-delta ${k.delta.includes('▲') ? 'up' : 'down'}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="canvas-wrap">
          <div style={{ fontSize: '.92rem', fontWeight: 800, color: '#1C1C2E', marginBottom: 14 }}>{t('orders_chart', lang)}</div>
          <canvas ref={ordersCanvasRef} height={200} />
        </div>
        <div className="canvas-wrap">
          <div style={{ fontSize: '.92rem', fontWeight: 800, color: '#1C1C2E', marginBottom: 14 }}>{t('revenue_chart', lang)}</div>
          <canvas ref={revenueCanvasRef} height={200} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">{t('recent_orders', lang)}</div>
          <input className="admin-search" placeholder={t('search_order_no', lang)} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>{t('th_order_no', lang)}</th><th>{t('th_customer', lang)}</th><th>{t('th_cafe', lang)}</th><th>{t('th_amount', lang)}</th><th>{t('th_vat', lang)}</th><th>{t('th_status', lang)}</th><th>{t('th_pickup_code', lang)}</th></tr>
            </thead>
            <tbody>
              {store.orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.id}</strong></td>
                  <td>{t('th_customer', lang)}</td>
                  <td>{o.cafe}</td>
                  <td><span className="currency-sym">⃁</span>{o.amount.toFixed(2)}</td>
                  <td><span className="currency-sym">⃁</span>{o.vat.toFixed(2)}</td>
                  <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'ready' ? 'blue' : 'amber'}`}>
                    {o.status === 'pending' ? '⏳' : o.status === 'ready' ? '✅' : '✓'} {t(`status_${o.status}`, lang) || o.status}
                  </span></td>
                  <td><code style={{ background: 'var(--latte)', padding: '2px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: '.75rem' }}>{o.pickupCode}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
