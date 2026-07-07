'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { pushComplaint } from '../../lib/firebase';
import { t } from '../../i18n';

export default function ProfilePage() {
  const store = useAppStore();
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
      <div className="profile-hero">
        <div className="profile-avatar">
          {store.currentUser?.name?.charAt(0) || t('visitor', store.lang).charAt(0)}
          <div className="profile-avatar-badge">👑</div>
        </div>
        <div className="profile-name">{store.currentUser?.name || t('visitor', store.lang)}</div>
        <div className="profile-email">
          {store.currentUser?.email || t('login_to_view', store.lang)}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{store.currentUser?.points || 0}</div>
          <div className="stat-label">{t('loyalty_points_label', store.lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{store.currentUser?.orders || 0}</div>
          <div className="stat-label">{t('orders_completed', store.lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Gold</div>
          <div className="stat-label">{t('membership_label', store.lang)}</div>
        </div>
      </div>

      <p className="section-title">{t('settings_title', store.lang)}</p>
      <div className="setting-group">
        <div className="setting-row">
          <span className="setting-label">{t('dark_mode', store.lang)}</span>
          <button className="action-btn secondary setting-btn" onClick={() => store.toggleTheme()}>
            {t('toggle_label', store.lang)}
          </button>
        </div>
      </div>

      {store.isLoggedIn && (
        <>
          <p className="section-title complaint-section">⚠️ {store.lang === 'ar' ? 'تقديم شكوى' : 'File a Complaint'}</p>
          <div className="setting-group">
            <input className="coffee-input" style={{ marginBottom: 8 }} placeholder={store.lang === 'ar' ? 'الموضوع *' : 'Subject *'} value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} />
            <textarea className="coffee-input complaint-textarea" placeholder={store.lang === 'ar' ? 'الوصف *' : 'Description *'} value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)} />
            <button className="action-btn" onClick={handleSubmitComplaint} disabled={!complaintSubject.trim() || !complaintDesc.trim()}>
              {complaintSent ? '✅ ' + (store.lang === 'ar' ? 'تم الإرسال' : 'Sent!') : (store.lang === 'ar' ? '📨 إرسال الشكوى' : '📨 Submit Complaint')}
            </button>
          </div>
        </>
      )}

      {store.isLoggedIn && (
        <div className="logout-wrap">
          <button className="action-btn red-btn logout-btn" onClick={() => store.signOut()}>
            🚪 {t('logout_label', store.lang)}
          </button>
        </div>
      )}
    </div>
  );
}
