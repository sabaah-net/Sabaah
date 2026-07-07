'use client';
import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { t } from '../../i18n';

function formatNotifTime(n: any, lang: string): string {
  const ts = (n as any).createdAt || n.time;
  if (!ts) return '';
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return n.time || '';
}

function getDateGroup(dateStr: string): string {
  if (!dateStr) return 'older';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'older';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - now.getDay() * 86400000;
  const t = d.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfYesterday) return 'yesterday';
  if (t >= startOfWeek) return 'week';
  return 'older';
}

function getDateGroupLabel(group: string, ar: boolean): string {
  const labels: Record<string, string> = {
    today: ar ? 'اليوم' : 'Today',
    yesterday: ar ? 'أمس' : 'Yesterday',
    week: ar ? 'هذا الأسبوع' : 'This Week',
    older: ar ? 'أقدم' : 'Older',
  };
  return labels[group] || group;
}

export default function NotifInbox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, notifications } = useAppStore();

  useEffect(() => {
    const el = document.getElementById('notifInbox');
    if (el) {
      if (isOpen) el.classList.add('open');
      else el.classList.remove('open');
    }
  }, [isOpen]);

  const markRead = (id: string | number) => {
    update(ref(db, `notifications/${String(id)}`), { read: true });
  };

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read && n.id) {
        update(ref(db, `notifications/${String(n.id)}`), { read: true });
      }
    });
  };

  const sorted = [...notifications].sort((a, b) => {
    const timeA = (a as any).createdAt || a.time || '';
    const timeB = (b as any).createdAt || b.time || '';
    return timeB.localeCompare(timeA);
  });

  const unread = notifications.filter((n) => !n.read).length;

  const groups: Record<string, typeof sorted> = {};
  sorted.forEach((n) => {
    const key = getDateGroup((n as any).createdAt || '');
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  const groupKeys = ['today', 'yesterday', 'week', 'older'];

  return (
    <div className="notif-inbox" id="notifInbox">
      <div className="notif-inbox-header">
        <span>🔔 {t('notifications_title', lang)}</span>
        <span style={{ fontSize: '.75rem', color: 'var(--amber)', fontWeight: 700 }}>
          {unread > 0 ? `${unread} ${lang === 'ar' ? 'غير مقروء' : 'unread'}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {unread > 0 && (
            <button className="action-btn secondary" style={{ width: 'auto', padding: '3px 8px', fontSize: '.65rem', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={markAllRead}>
              {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
            </button>
          )}
          <button className="notif-close" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="notif-inbox-body">
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
            {t('no_notifications', lang)}
          </div>
        )}
        {groupKeys.map((key) => {
          const items = groups[key];
          if (!items || items.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '.7rem', fontWeight: 800, color: 'var(--text-mid)', textTransform: 'uppercase', padding: '6px 4px', letterSpacing: '.5px' }}>
                {getDateGroupLabel(key, lang === 'ar')}
              </div>
              {items.map((n, i) => (
                <div key={i} className="notif-item" style={{
                  display: 'flex', gap: 10, padding: 12,
                  opacity: n.read ? 0.55 : 1,
                  background: n.read ? '#fff' : 'var(--foam)',
                  borderLeft: n.read ? '3px solid transparent' : '3px solid var(--amber)',
                  cursor: 'pointer',
                }} onClick={() => !n.read && markRead(n.id)}>
                  <span style={{ fontSize: '1.2rem' }}>{n.icon || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '.85rem' }}>{n.title}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-light)', marginTop: 2 }}>{n.body}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text-mid)', marginTop: 4, fontWeight: 600 }}>{formatNotifTime(n, lang)}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}