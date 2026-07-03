'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function AdminAudit() {
  const { auditLog, lang } = useAppStore();

  const typeColors: Record<string, string> = {
    login: 'blue', order: 'green', finance: 'amber', user: 'green',
    inventory: 'blue', create: 'green', update: 'blue', notification: 'amber',
    security: 'red', system: 'blue', delete: 'red',
  };

  const severityColors: Record<string, string> = {
    info: 'blue', warning: 'amber', error: 'red',
  };

  return (
    <div className="admin-page" id="apAudit">
      <div className="admin-table-header">
        <div className="admin-table-title">{t('audit_title', lang)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="admin-search" placeholder={t('search_audit', lang)} />
          <button className="action-btn secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '.8rem' }}>{t('export_btn', lang)}</button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>{t('th_date', lang)}</th><th>{t('th_user', lang)}</th><th>{t('th_action', lang)}</th><th>{t('th_type', lang)}</th><th>{t('th_details', lang)}</th></tr>
          </thead>
          <tbody>
            {auditLog.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_records', lang)}</td></tr>
            )}
            {auditLog.map((log, i) => (
              <tr key={i}>
                <td style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>{log.time}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td><span className={`table-badge badge-${typeColors[log.type] || 'blue'}`}>{log.type}</span></td>
                <td style={{ fontSize: '.82rem', color: 'var(--text-light)' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
