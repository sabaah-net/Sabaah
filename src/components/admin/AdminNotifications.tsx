'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { createCampaign, addAuditLog } from '../../lib/supabase';
import { useToast } from '../shared/Toast';
import { t } from '../../i18n';

export default function AdminNotifications() {
  const { campaigns, loadFromSupabase, lang } = useAppStore();
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'customers' | 'partners'>('all');

  const handleSend = async () => {
    if (!title || !message) { show(t('err_notif_required', lang), 'error'); return; }
    try {
      const audienceLabel = audience === 'all' ? t('admin_audience_all', lang) : audience === 'customers' ? t('admin_audience_customers', lang) : t('admin_audience_partners', lang);
      await createCampaign({
        name_ar: title,
        description_ar: message,
        segment: audienceLabel,
        status: 'sent',
        reach_count: 0,
      });
      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: t('admin_audit_send_notif', lang).replace('{title}', title),
        action_type: 'notification',
        details: t('admin_audit_notif_audience', lang).replace('{audience}', audienceLabel),
      });
      await loadFromSupabase();
      show(t('success_notif_sent', lang).replace('{audience}', audienceLabel), 'success');
      setTitle('');
      setMessage('');
    } catch (e) {
      show(t('err_send_notif', lang), 'error');
    }
  };

  const statusMap: Record<string, string> = {
    sent: t('notif_sent', lang),
    scheduled: t('notif_scheduled', lang),
    draft: t('notif_draft', lang),
  };

  return (
    <div className="admin-page" id="apNotifications">
      <div className="admin-table-wrap" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="admin-table-header">
          <div className="admin-table-title">{t('notif_title', lang)}</div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select className="coffee-input" value={audience} onChange={(e) => setAudience(e.target.value as any)}>
            <option value="all">{t('audience_all', lang)}</option>
            <option value="customers">{t('audience_customers', lang)}</option>
            <option value="partners">{t('audience_partners', lang)}</option>
          </select>
          <input className="coffee-input" placeholder={t('f_notif_title', lang)} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="coffee-input" placeholder={t('f_notif_message', lang)} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="action-btn" style={{ width: '100%' }} onClick={handleSend}>{t('btn_send', lang)}</button>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: 20 }}>
        <div className="admin-table-header">
          <div className="admin-table-title">{t('campaign_history', lang)}</div>
        </div>
        <table className="admin-table">
          <thead><tr><th>{t('th_date', lang)}</th><th>{t('th_title', lang)}</th><th>{t('th_message', lang)}</th><th>{t('th_audience', lang)}</th><th>{t('th_status', lang)}</th></tr></thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_campaigns', lang)}</td></tr>
            )}
            {campaigns.map((c, i) => (
              <tr key={i}>
                <td style={{ fontSize: '.78rem' }}>{c.time}</td>
                <td><strong>{c.name}</strong></td>
                <td style={{ fontSize: '.82rem', color: 'var(--text-light)' }}>{c.segment}</td>
                <td><span className="table-badge badge-blue">{c.segment}</span></td>
                <td><span className={`table-badge badge-${c.status === 'sent' ? 'green' : 'amber'}`}>{statusMap[c.status] || c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
