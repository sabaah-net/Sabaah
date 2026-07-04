'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function NotifInbox() {
  const { lang, notifications } = useAppStore();

  const close = () => document.getElementById('notifInbox')?.classList.remove('open');

  return (
    <div className="notif-inbox" id="notifInbox">
      <div className="notif-inbox-header">
        <span>🔔 {t('notifications_title', lang)}</span>
        <button className="notif-close" onClick={close}>✕</button>
      </div>
      <div className="notif-inbox-body">
        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
            {t('no_notifications', lang)}
          </div>
        )}
        {notifications.map((n, i) => (
          <div key={i} className="notif-item" style={{
            display: 'flex', gap: 10, padding: 12, borderBottom: '1px solid var(--latte)',
            opacity: n.read ? 0.5 : 1,
          }}>
            <span>{n.icon || '🔔'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{n.title}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-light)', marginTop: 2 }}>{n.body}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--text-light)', marginTop: 4 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
