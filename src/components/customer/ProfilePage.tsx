'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function ProfilePage() {
  const store = useAppStore();

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
          <label style={{ position: 'relative', width: 44, height: 24 }}>
            <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: 40, cursor: 'pointer', transition: '.25s', background: 'var(--green)' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--latte)' }}>
          <span style={{ fontSize: '.85rem' }}>{t('dark_mode', store.lang)}</span>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '.7rem' }} onClick={() => store.toggleTheme()}>
            {t('toggle_label', store.lang)}
          </button>
        </div>
      </div>

      {store.isLoggedIn && (
        <button className="action-btn red-btn" onClick={() => store.setLoggedIn(false, null)}>
          {t('logout_label', store.lang)}
        </button>
      )}
    </div>
  );
}
