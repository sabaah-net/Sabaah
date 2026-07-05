'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../i18n';
import PartnerOrders from './PartnerOrders';
import PartnerInventory from './PartnerInventory';
import PartnerStaff from './PartnerStaff';
import PartnerPromos from './PartnerPromos';

type Tab = 'orders' | 'inventory' | 'staff' | 'promos';

export default function PartnerPortal() {
  const store = useAppStore();
  const { signOut } = useAppStore();
  const lang = store.lang;
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isOpen, setIsOpen] = useState(true);
  const [cafeId, setCafeId] = useState<string | null>(null);

  useEffect(() => {
    const pid = store.currentUser?.profileId;
    if (!pid) return;
    (async () => {
      const { data } = await supabase.from('cafes').select('id, is_open').eq('owner_id', pid).maybeSingle();
      if (data) {
        setCafeId(data.id);
        setIsOpen(data.is_open);
      }
    })();
  }, []);

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (cafeId) {
      await supabase.from('cafes').update({ is_open: next }).eq('id', cafeId);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 14px' }}>
      <div style={{
        background: 'var(--bark)', color: '#fff', borderRadius: 'var(--r-md)',
        padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>{t('partner_today_earnings', lang)}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>⃁ 345.00</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>{t('partner_orders', lang)}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>{store.partnerOrders.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>{t('partner_inventory', lang)}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>87%</div>
        </div>
      </div>
      <button className="action-btn secondary" style={{ width: 'auto', padding: '6px 14px', fontSize: '.75rem', marginBottom: 10 }} onClick={signOut}>{t('logout_label', lang)}</button>

      <div style={{
        background: isOpen ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `2px solid ${isOpen ? 'var(--green)' : 'var(--red)'}`,
        borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: '1.8rem' }}>{isOpen ? '🟢' : '🔴'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.95rem', fontWeight: 900, color: isOpen ? 'var(--green)' : 'var(--red)' }}>
            {isOpen ? t('partner_open', lang) : t('partner_closed', lang)}
          </div>
          <div style={{ fontSize: '.72rem', color: isOpen ? '#4aaa7a' : '#e74c3c' }}>
            {isOpen ? t('partner_accepting', lang) : t('partner_not_accepting', lang)}
          </div>
        </div>
        <label style={{ position: 'relative', width: 50, height: 26, flexShrink: 0 }}>
          <input type="checkbox" checked={isOpen} onChange={handleToggle} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{
            position: 'absolute', inset: 0, borderRadius: 40, cursor: 'pointer',
            transition: '.25s', background: isOpen ? 'var(--green)' : 'var(--red)',
          }} />
        </label>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>{t('partner_order_title', lang)}</button>
        <button className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>{t('partner_inv_tab', lang)}</button>
        <button className={`admin-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>{t('partner_staff_tab', lang)}</button>
        <button className={`admin-tab ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => setActiveTab('promos')}>{t('partner_promo_tab', lang)}</button>
      </div>

      {activeTab === 'orders' && <PartnerOrders />}
      {activeTab === 'inventory' && <PartnerInventory />}
      {activeTab === 'staff' && <PartnerStaff />}
      {activeTab === 'promos' && <PartnerPromos />}
    </div>
  );
}
