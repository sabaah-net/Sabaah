'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ref, update, push, set } from 'firebase/database';
import { db, pushComplaint } from '../../lib/firebase';
import { t } from '../../i18n';

export default function ProfilePage() {
  const store = useAppStore();
  const unreadCount = store.notifications.filter(n => !n.read).length;
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSent, setComplaintSent] = useState(false);

  const handleSubmitComplaint = async () => {
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;
    pushComplaint({
      userId: store.currentUser?.profileId || '',
      userName: store.currentUser?.name || '',
      subject: complaintSubject,
      description: complaintDesc,
      status: 'open',
    });
    setComplaintSubject('');
    setComplaintDesc('');
    setComplaintSent(true);
    setTimeout(() => setComplaintSent(false), 3000);
  };

  return (
    <div id="pageProfile">
      <div style={{
        background: 'linear-gradient(135deg,var(--bark),#5C2E1A)', borderRadius: 'var(--r-md)',
        padding: '22px 18px', marginBottom: 14, textAlign: 'center', color: '#fff',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'var(--amber)', color: '#fff',
          fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px', border: '3px solid rgba(255,255,255,.3)', position: 'relative',
        }}>
          {store.currentUser?.name?.charAt(0) || t('visitor', store.lang).charAt(0)}
          <div style={{
            position: 'absolute', bottom: -2, right: -2, background: 'var(--gold)', width: 24, height: 24,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.7rem', border: '2px solid #fff',
          }}>👑</div>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{store.currentUser?.name || t('visitor', store.lang)}</div>
        <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
          {store.currentUser?.email || t('login_to_view', store.lang)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>{store.currentUser?.points || 0}</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>{t('loyalty_points_label', store.lang)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>{store.currentUser?.orders || 0}</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>{t('orders_completed', store.lang)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>Gold</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>{t('membership_label', store.lang)}</div>
        </div>
      </div>

      <p className="section-title">{t('settings_title', store.lang)}</p>
      <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--latte)' }}>
          <span style={{ fontSize: '.85rem' }}>{t('notifications_title', store.lang)}</span>
          <label className="ios-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider" style={{ background: 'var(--green)' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--latte)' }}>
          <span style={{ fontSize: '.85rem' }}>{t('dark_mode', store.lang)}</span>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '.7rem' }} onClick={() => store.toggleTheme()}>
            {t('toggle_label', store.lang)}
          </button>
        </div>
      </div>

      {/* Complaint Form */}
      {store.isLoggedIn && (
        <>
          <p className="section-title" style={{ marginTop: 14 }}>⚠️ {store.lang === 'ar' ? 'تقديم شكوى' : 'File a Complaint'}</p>
          <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)', marginBottom: 10 }}>
            <input className="coffee-input" style={{ marginBottom: 8 }} placeholder={store.lang === 'ar' ? 'الموضوع *' : 'Subject *'} value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} />
            <textarea className="coffee-input" style={{ minHeight: 80, resize: 'vertical', marginBottom: 8 }} placeholder={store.lang === 'ar' ? 'الوصف *' : 'Description *'} value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)} />
            <button className="action-btn" style={{ width: '100%' }} onClick={handleSubmitComplaint} disabled={!complaintSubject.trim() || !complaintDesc.trim()}>
              {complaintSent ? '✅ ' + (store.lang === 'ar' ? 'تم الإرسال' : 'Sent!') : (store.lang === 'ar' ? '📨 إرسال الشكوى' : '📨 Submit Complaint')}
            </button>
          </div>
        </>
      )}

      {/* Notification Inbox */}
      {store.isLoggedIn && store.notifications.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p className="section-title">
            {t('notifications_title', store.lang)} {unreadCount > 0 && <span style={{ fontSize: '.75rem', color: 'var(--amber)', fontWeight: 700 }}>({unreadCount})</span>}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {store.notifications.sort((a, b) => {
              const timeA = (a as any).createdAt || a.time || '';
              const timeB = (b as any).createdAt || b.time || '';
              return timeB.localeCompare(timeA);
            }).map((n, i) => (
              <div key={i} style={{
                background: n.read ? '#fff' : 'var(--foam)',
                borderRadius: 'var(--r-sm)', padding: '10px 12px',
                boxShadow: 'var(--sh-sm)', display: 'flex', gap: 10, alignItems: 'flex-start',
                borderLeft: n.read ? '3px solid transparent' : '3px solid var(--amber)',
              }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{n.icon || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: n.read ? 400 : 700 }}>{n.title}</div>
                  <div style={{ fontSize: '.72rem', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: '.6rem', marginTop: 4, fontWeight: 600 }}>{n.time}</div>
                </div>
                {!n.read && store.currentUser?.profileId && (
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.7rem', color: 'var(--amber)', fontWeight: 700, flexShrink: 0 }}
                    onClick={() => update(ref(db, `notifications/${String(n.id)}`), { read: true })}
                  >
                    {store.lang === 'ar' ? 'مقروء' : 'Read'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {store.isLoggedIn && (
        <button className="action-btn red-btn" onClick={() => store.signOut()}>
          {t('logout_label', store.lang)}
        </button>
      )}
    </div>
  );
}