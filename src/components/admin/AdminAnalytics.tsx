'use client';
import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { getBestSellingItems, getHourlyDistribution, getCategoryDistribution } from '../../lib/reports';
import type { BestSellingItem, HourlyOrder, CategoryDistribution } from '../../types';

function drawDoughnut(canvas: HTMLCanvasElement | null, segments: { val: number; color: string }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const cx = rect.width / 2, cy = rect.height / 2;
  const outer = Math.max(Math.min(cx, cy) - 10, 1);
  const inner = outer * 0.55;
  const total = segments.reduce((s, s2) => s + s2.val, 0);
  if (total <= 0) return;
  let start = -Math.PI / 2;
  segments.forEach((seg) => {
    const angle = (seg.val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, start, start + angle);
    ctx.arc(cx, cy, inner, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  });
}

export default function AdminAnalytics() {
  const { lang } = useAppStore();
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const [bestSellers, setBestSellers] = useState<BestSellingItem[]>([]);
  const [hourly, setHourly] = useState<HourlyOrder[]>([]);
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBestSellingItems(),
      getHourlyDistribution(),
      getCategoryDistribution(),
    ]).then(([bs, h, c]) => {
      setBestSellers(bs);
      setHourly(h);
      setCategories(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      drawDoughnut(doughnutRef.current, categories.map(c => ({ val: c.percentage, color: c.color })));
    }
  }, [categories]);

  const maxHourly = Math.max(...hourly.map(h => h.count), 1);

  return (
    <div className="admin-page" id="apAnalytics">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>{t('analytics_title', lang)}</div>

      {loading ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>{t('report_loading', lang)}</p>
      ) : (
        <>
          <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
            <div className="admin-table-header">
              <div className="admin-table-title">{t('best_selling', lang)}</div>
            </div>
            <table className="admin-table">
              <thead><tr><th>{t('th_rank', lang)}</th><th>{t('th_drink', lang)}</th><th>{t('th_sales', lang)}</th><th>{t('th_revenue', lang)}</th><th>{t('th_popularity', lang)}</th></tr></thead>
              <tbody>
                {bestSellers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('report_no_data', lang)}</td></tr>
                )}
                {bestSellers.slice(0, 10).map((item, i) => {
                  const maxSales = bestSellers[0]?.sales || 1;
                  const pct = (item.sales / maxSales) * 100;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: i <= 2 ? 'var(--amber)' : 'var(--text-light)' }}>#{i + 1}</td>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.sales.toLocaleString()}</td>
                      <td><span className="currency-sym">⃁</span>{item.revenue.toFixed(0)}</td>
                      <td>
                        <div style={{ height: 6, width: '100%', background: 'var(--latte)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: 6, width: `${pct}%`, background: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--green)' : i === 2 ? 'var(--blue)' : 'var(--text-light)', borderRadius: 3 }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="canvas-wrap">
              <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 10 }}>{t('category_distribution', lang)}</div>
              <canvas ref={doughnutRef} height={200} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: '.72rem', flexWrap: 'wrap' }}>
                {categories.map((c, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                    {c.category} {c.percentage}%
                  </span>
                ))}
              </div>
            </div>
            <div className="canvas-wrap">
              <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 10 }}>{t('peak_hours', lang)}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, padding: '0 8px' }}>
                {hourly.map((h, i) => {
                  const barHeight = maxHourly > 0 ? (h.count / maxHourly) * 100 : 0;
                  const isPeak = i >= 6 && i <= 10;
                  return (
                    <div key={i} style={{
                      flex: 1, background: isPeak ? 'var(--amber)' : 'var(--latte)',
                      height: `${Math.max(barHeight, 1)}%`, borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column',
                      justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4,
                      fontSize: '.6rem', color: 'var(--text-light)',
                    }}>
                      <span>{h.count || ''}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.65rem', color: 'var(--text-light)', marginTop: 6, padding: '0 8px' }}>
                {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => (
                  <span key={h}>{h}:00</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
