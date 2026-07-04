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

export function downloadPDF(title: string, tables: { caption: string; headers: string[]; rows: string[][] }[]) {
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; padding: 20px; }
  h1 { font-size: 22px; color: #5C2E1A; border-bottom: 3px solid #C8A27A; padding-bottom: 8px; }
  .sub { font-size: 12px; color: #888; margin-bottom: 20px; }
  h2 { font-size: 16px; color: #5C2E1A; margin: 24px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #5C2E1A; color: #fff; padding: 8px 10px; font-size: 12px; text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0d6cc; font-size: 12px; }
  tr:nth-child(even) td { background: #f8f4f0; }
  .footer { margin-top: 30px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #e0d6cc; padding-top: 10px; }
</style></head><body>
<h1>${title}</h1>
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
