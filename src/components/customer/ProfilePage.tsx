'use client';
import { useAppStore } from '../../store/useAppStore';

export default function ProfilePage() {
  const store = useAppStore();

  const handleExport = () => {
    const data = { user: store.currentUser, orders: store.orders, transactions: store.transactions, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sabaa-data-${Date.now()}.json`;
    a.click();
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
          {store.currentUser?.name?.charAt(0) || '؟'}
          <div style={{
            position: 'absolute', bottom: -2, right: -2, background: 'var(--gold)', width: 24, height: 24,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.7rem', border: '2px solid #fff',
          }}>👑</div>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{store.currentUser?.name || 'زائر'}</div>
        <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
          {store.currentUser?.email || 'سجل الدخول لعرض التفاصيل'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>{store.currentUser?.points || 0}</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>نقطة ولاء</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>{store.currentUser?.orders || 0}</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>طلب مكتمل</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--amber)' }}>Gold</div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 2 }}>العضوية</div>
        </div>
      </div>

      <p className="section-title">⚙️ الإعدادات</p>
      <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--latte)' }}>
          <span style={{ fontSize: '.85rem' }}>🔔 الإشعارات</span>
          <label style={{ position: 'relative', width: 44, height: 24 }}>
            <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: 40, cursor: 'pointer', transition: '.25s', background: 'var(--green)' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--latte)' }}>
          <span style={{ fontSize: '.85rem' }}>🌙 الوضع الليلي</span>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '.7rem' }} onClick={() => store.toggleTheme()}>
            تبديل
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: '.85rem' }}>💾 تصدير بياناتي</span>
          <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '.7rem' }} onClick={handleExport}>
            تصدير JSON
          </button>
        </div>
      </div>

      {store.isLoggedIn && (
        <button className="action-btn red-btn" onClick={() => store.setLoggedIn(false, null)}>
          🚪 تسجيل الخروج
        </button>
      )}
    </div>
  );
}
