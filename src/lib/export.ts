export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function downloadJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

const SABAAH_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
  <rect x="10" y="15" width="80" height="65" rx="8" fill="#1C110C"/>
  <rect x="70" y="25" width="18" height="30" rx="5" fill="#1C110C"/>
  <rect x="16" y="21" width="68" height="52" rx="5" fill="#FAF6F2"/>
  <ellipse cx="50" cy="75" rx="30" ry="6" fill="#1C110C"/>
  <text x="50" y="58" font-family="Cairo,sans-serif" font-size="32" font-weight="900" text-anchor="middle" fill="#1C110C">٧</text>
  <path d="M30 12 Q35 4 40 12" stroke="#C0692A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M45 8 Q50 0 55 8" stroke="#C0692A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M60 12 Q65 4 70 12" stroke="#C0692A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`;

export function downloadPDF(title: string, tables: { caption: string; headers: string[]; rows: string[][] }[]) {
  const logoBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(SABAAH_LOGO_SVG)))}`;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; padding: 20px; }
  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .header img { width: 40px; height: 40px; }
  .header-text { font-size: 22px; color: #5C2E1A; font-weight: 800; }
  .sub { font-size: 12px; color: #888; margin-bottom: 20px; }
  h2 { font-size: 16px; color: #5C2E1A; margin: 24px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #5C2E1A; color: #fff; padding: 8px 10px; font-size: 12px; text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0d6cc; font-size: 12px; }
  tr:nth-child(even) td { background: #f8f4f0; }
  .footer { margin-top: 30px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #e0d6cc; padding-top: 10px; }
</style></head><body>
<div class="header">
  <img src="${logoBase64}" alt="Sabaah" />
  <div class="header-text">${title}</div>
</div>
<div class="sub">${new Date().toLocaleString('en-US')}</div>
${tables.map(t => `
<h2>${t.caption}</h2>
<table><thead><tr>${t.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table>`).join('')}
<div class="footer">Sabaah Coffee · Generated ${new Date().toISOString().slice(0, 10)}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    w.onload = () => { w.print(); };
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
