'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../i18n';
import { ref, onValue, off, db, saveCafeStatus } from '../../lib/firebase';
import PartnerOrders from './PartnerOrders';
import PartnerInventory from './PartnerInventory';
import PartnerStaff from './PartnerStaff';
import PartnerPromos from './PartnerPromos';
import PartnerItems from './PartnerItems';

type Tab = 'orders' | 'inventory' | 'staff' | 'promos' | 'items';

export default function PartnerPortal() {
  const store = useAppStore();
  const { signOut } = useAppStore();
  const lang = store.lang;
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isOpen, setIsOpen] = useState(true);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [pointsPerItem, setPointsPerItem] = useState(10);
  const [savingPoints, setSavingPoints] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [partnerRole, setPartnerRole] = useState<string>('staff');
  const [nearbyPopup, setNearbyPopup] = useState<{ title: string; body: string } | null>(null);
  const seenNotifs = useRef<Set<string>>(new Set());
  const popupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const pid = store.currentUser?.profileId;
    if (!pid) return;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('partner_role').eq('id', pid).maybeSingle();
      if (profile?.partner_role) setPartnerRole(profile.partner_role);

      const { data } = await supabase.from('cafes').select('id, is_open, points_per_item').eq('owner_id', pid).maybeSingle();
      if (data) {
        setCafeId(data.id);
        setIsOpen(data.is_open);
        setPointsPerItem(data.points_per_item || 10);
      }
    })();

    let cleanup: (() => void) | undefined;
    if (pid) {
      const r = ref(db, 'notifications');
      const fn = onValue(r, (snap) => {
        const val = snap.val();
        const notifs = val ? Object.values(val) as any[] : [];
        setNotifCount(notifs.filter((n: any) => !n.read).length);
        const latest = notifs[notifs.length - 1] as any;
        if (latest && !seenNotifs.current.has(latest.id) && latest.icon === '📍') {
          seenNotifs.current.add(latest.id);
          setNearbyPopup({ title: latest.title, body: latest.body });
          popupTimer.current = setTimeout(() => setNearbyPopup(null), 5000);
        }
      });
      cleanup = () => { off(r, 'value', fn); clearTimeout(popupTimer.current); };
    }
    return () => { if (cleanup) cleanup(); };
  }, []);

  const isOwner = partnerRole === 'owner';
  const isAdmin = partnerRole === 'owner' || partnerRole === 'admin';
  const isCashier = partnerRole === 'cashier';
  const isStaff = partnerRole === 'staff';

  const handleToggle = async () => {
    if (!isOwner || !cafeId) return;
    const next = !isOpen;
    setIsOpen(next);
    await supabase.from('cafes').update({ is_open: next }).eq('id', cafeId);
    saveCafeStatus(cafeId, next);
  };

  const handlePointsChange = async () => {
    if (!isOwner || !cafeId) return;
    setSavingPoints(true);
    await supabase.from('cafes').update({ points_per_item: pointsPerItem }).eq('id', cafeId);
    setSavingPoints(false);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#fff' }}>☕</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '.95rem' }}>{lang === 'ar' ? 'لوحة التحكم' : 'Partner Dashboard'}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{store.currentUser?.name || ''}</div>
          </div>
        </div>
        <button className="action-btn secondary" style={{ width: 'auto', padding: '6px 14px', fontSize: '.72rem' }} onClick={signOut}>{t('logout_label', lang)}</button>
      </div>

      {isOwner && (
        <div style={{
          background: '#fff', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: 'var(--sh-sm)', border: '1px solid var(--latte)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--bark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff',
          }}>⭐</div>
          <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>
            {lang === 'ar' ? 'النقاط لكل عنصر' : 'Points per Item'}
          </span>
          <input type="number" min="0" max="100" value={pointsPerItem}
            onChange={(e) => setPointsPerItem(Number(e.target.value))}
            style={{
              width: 48, padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--latte)',
              textAlign: 'center', fontSize: '.9rem', fontWeight: 900, background: 'var(--cream)',
            }} />
          <button className="action-btn" style={{ width: 'auto', padding: '6px 14px', fontSize: '.72rem', whiteSpace: 'nowrap' }}
            disabled={savingPoints} onClick={handlePointsChange}>
            {savingPoints ? '...' : (lang === 'ar' ? 'حفظ' : 'Save')}
          </button>
        </div>
      )}

      <div style={{
        background: isOpen ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1.5px solid ${isOpen ? 'var(--green)' : 'var(--red)'}`,
        borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: '1.5rem', cursor: isOwner ? 'pointer' : 'default' }} onClick={handleToggle}>{isOpen ? '🟢' : '🔴'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.9rem', fontWeight: 900, color: isOpen ? 'var(--green)' : 'var(--red)' }}>
            {isOpen ? t('partner_open', lang) : t('partner_closed', lang)}
          </div>
          <div style={{ fontSize: '.68rem', color: isOpen ? '#4aaa7a' : '#e74c3c' }}>
            {isOpen ? t('partner_accepting', lang) : t('partner_not_accepting', lang)}
          </div>
        </div>
        {isOwner && (
          <label className="ios-switch">
            <input type="checkbox" checked={isOpen} onChange={handleToggle} />
            <span className="slider" style={{ background: isOpen ? 'var(--green)' : 'var(--red)' }} />
          </label>
        )}
      </div>

      <div className="admin-tabs" style={{ marginBottom: 12 }}>
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📋 {t('partner_order_title', lang)} {notifCount > 0 && <span className="table-badge badge-red" style={{ marginLeft: 4, verticalAlign: 'top' }}>{notifCount}</span>}
        </button>
        <button className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📦 {t('partner_inv_tab', lang)}</button>
        {(isOwner || isAdmin) && (
          <button className={`admin-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>👥 {t('partner_staff_tab', lang)}</button>
        )}
        {isOwner && (
          <button className={`admin-tab ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => setActiveTab('promos')}>🏷️ {t('partner_promo_tab', lang)}</button>
        )}
        <button className={`admin-tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
          ☕ {lang === 'ar' ? 'عناصر القائمة' : 'Menu Items'}
        </button>
      </div>

      {activeTab === 'orders' && <PartnerOrders />}
      {activeTab === 'inventory' && <PartnerInventory />}
      {activeTab === 'staff' && <PartnerStaff cafeId={cafeId} partnerRole={partnerRole} />}
      {activeTab === 'promos' && <PartnerPromos cafeId={cafeId} />}
      {activeTab === 'items' && <PartnerItems />}

      {nearbyPopup && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,.15)', maxWidth: 300,
          borderLeft: '4px solid #d4a24c', animation: 'slideUp .3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <span style={{ fontWeight: 900, fontSize: '.85rem', color: '#333' }}>{nearbyPopup.title}</span>
          </div>
          <div style={{ fontSize: '.78rem', color: '#666', lineHeight: 1.4 }}>{nearbyPopup.body}</div>
          <button
            onClick={() => setNearbyPopup(null)}
            style={{
              marginTop: 8, background: 'none', border: 'none', color: '#999',
              fontSize: '.7rem', cursor: 'pointer', padding: 0,
            }}
          >{lang === 'ar' ? 'إغلاق' : 'Dismiss'}</button>
        </div>
      )}
    </div>
  );
}
