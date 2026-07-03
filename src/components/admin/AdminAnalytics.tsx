'use client';
import { useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

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

  useEffect(() => {
    drawDoughnut(doughnutRef.current, [
      { val: 45, color: '#C0692A' },
      { val: 25, color: '#2A7A52' },
      { val: 18, color: '#1E5F9E' },
      { val: 12, color: '#9B7B68' },
    ]);
  }, []);

  return (
    <div className="admin-page" id="apAnalytics">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>{t('analytics_title', lang)}</div>

      <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
        <div className="admin-table-header">
          <div className="admin-table-title">{t('best_selling', lang)}</div>
        </div>
        <table className="admin-table">
          <thead><tr><th>{t('th_rank', lang)}</th><th>{t('th_drink', lang)}</th><th>{t('th_sales', lang)}</th><th>{t('th_revenue', lang)}</th><th>{t('th_popularity', lang)}</th></tr></thead>
          <tbody>
            {[
              { rank: 1, name: 'قهوة إسباني', sales: 1280, rev: 10240 },
              { rank: 2, name: 'سبانيش لاتيه', sales: 960, rev: 7680 },
              { rank: 3, name: 'كورتادو', sales: 720, rev: 5040 },
              { rank: 4, name: 'موكا', sales: 540, rev: 4320 },
              { rank: 5, name: 'أمريكانو', sales: 410, rev: 2870 },
            ].map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 800, color: item.rank <= 3 ? 'var(--amber)' : 'var(--text-light)' }}>#{item.rank}</td>
                <td><strong>{item.name}</strong></td>
                <td>{item.sales.toLocaleString()}</td>
                <td>{item.rev.toLocaleString()} ⃁</td>
                <td>
                  <div style={{ height: 6, width: '100%', background: 'var(--latte)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: 6, width: `${100 - (i * 15)}%`, background: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--green)' : i === 2 ? 'var(--blue)' : 'var(--text-light)', borderRadius: 3 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="canvas-wrap">
          <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 10 }}>{t('category_distribution', lang)}</div>
          <canvas ref={doughnutRef} height={200} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: '.72rem' }}>
            <span>🟠 اسباني 45%</span>
            <span>🟢 لاتيه 25%</span>
            <span>🔵 كورتادو 18%</span>
            <span>🟤 موكا 12%</span>
          </div>
        </div>
        <div className="canvas-wrap">
          <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 10 }}>{t('peak_hours', lang)}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, padding: '0 8px' }}>
            {[20, 15, 30, 55, 70, 85, 65, 45, 25, 10, 5, 15].map((h, i) => (
              <div key={i} style={{
                flex: 1, background: i >= 4 && i <= 7 ? 'var(--amber)' : 'var(--latte)',
                height: `${h}%`, borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4,
                fontSize: '.6rem', color: 'var(--text-light)',
              }}>
                <span>{h}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.65rem', color: 'var(--text-light)', marginTop: 6, padding: '0 8px' }}>
            <span>6ص</span><span>8ص</span><span>10ص</span><span>12م</span><span>2م</span><span>4م</span><span>6م</span><span>8م</span><span>10م</span><span>12ص</span><span>2ص</span><span>4ص</span>
          </div>
        </div>
      </div>
    </div>
  );
}
