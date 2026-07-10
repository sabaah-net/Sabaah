'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { createCampaign, addAuditLog, getAllProfiles } from '../../lib/supabase';
import { ref, onValue, off, set, db } from '../../lib/firebase';
import { useToast } from '../shared/Toast';
import { t } from '../../i18n';

interface NotifRow {
  id: string;
  userId: string;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  time: string;
  createdAt: string;
}

export default function AdminNotifications() {
  const { campaigns, loadFromSupabase, lang } = useAppStore();
  const { show } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'customers' | 'partners'>('all');
  const [tab, setTab] = useState<'send' | 'inbox'>('send');
  const [allNotifs, setAllNotifs] = useState<NotifRow[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await getAllProfiles();
      if (data) setProfiles(data.map((p: any) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })));
    })();
  }, []);

  useEffect(() => {
    const r = ref(db, 'notifications');
    const fn = onValue(r, (snap) => {
      const val: Record<string, any> = snap.val() || {};
      const list: NotifRow[] = [];
      for (const nid of Object.keys(val)) {
        list.push({ id: nid, userId: 'global', ...val[nid] });
      }
      list.sort((a, b) => (b.createdAt || b.time || '').localeCompare(a.createdAt || a.time || ''));
      setAllNotifs(list);
    });
    return () => off(r, 'value', fn);
  }, []);

  const handleSend = async () => {
    if (!title || !message) { show(t('err_notif_required', lang), 'error'); return; }
    try {
      const audienceLabel = audience === 'all' ? t('admin_audience_all', lang) : audience === 'customers' ? t('admin_audience_customers', lang) : t('admin_audience_partners', lang);

      const notifId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await set(ref(db, `notifications/${notifId}`), {
        id: notifId,
        title,
        body: message,
        icon: '🔔',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        read: false,
        priority: 'high',
        audience: audienceLabel,
        createdAt: new Date().toISOString(),
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
      <div className="admin-tabs" style={{ margin: '0 0 16px' }}>
        <button className={`admin-tab ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>
          {lang === 'ar' ? '📤 إرسال إشعار' : '📤 Send Notification'}
        </button>
        <button className={`admin-tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>
          {lang === 'ar' ? '📥 صندوق الوارد' : '📥 Notification Inbox'} {allNotifs.length > 0 && <span className="table-badge badge-red" style={{ marginLeft: 4 }}>{allNotifs.filter(n => !n.read).length}</span>}
        </button>
      </div>

      {tab === 'send' && (
        <>
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
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>{t('no_campaigns', lang)}</td></tr>
                )}
                {campaigns.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '.78rem' }}>{c.time}</td>
                    <td><strong>{c.name}</strong></td>
                    <td style={{ fontSize: '.82rem' }}>{c.segment}</td>
                    <td><span className="table-badge badge-blue">{c.segment}</span></td>
                    <td><span className={`table-badge badge-${c.status === 'sent' ? 'green' : 'amber'}`}>{statusMap[c.status] || c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'inbox' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <div className="admin-table-title">{lang === 'ar' ? '📥 جميع الإشعارات' : '📥 All Notifications'}</div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                <th>{lang === 'ar' ? 'العنوان' : 'Title'}</th>
                <th>{lang === 'ar' ? 'المحتوى' : 'Body'}</th>
                <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {allNotifs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>{lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</td></tr>
              )}
              {allNotifs.map((n, i) => {
                const profile = profiles.find(p => p.id === n.userId);
                return (
                  <tr key={n.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{profile?.name || n.userId}</td>
                    <td><strong>{n.title}</strong></td>
                    <td style={{ fontSize: '.78rem' }}>{n.body}</td>
                    <td style={{ fontSize: '.78rem' }}>{n.time}</td>
                    <td>
                      <span className={`table-badge badge-${n.read ? 'green' : 'amber'}`}>
                        {n.read ? (lang === 'ar' ? 'مقروء' : 'Read') : (lang === 'ar' ? 'جديد' : 'New')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}