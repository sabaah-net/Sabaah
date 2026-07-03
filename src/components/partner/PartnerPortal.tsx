'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import PartnerOrders from './PartnerOrders';
import PartnerInventory from './PartnerInventory';
import PartnerStaff from './PartnerStaff';
import PartnerPromos from './PartnerPromos';

type Tab = 'orders' | 'inventory' | 'staff' | 'promos';

export default function PartnerPortal() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 14px' }}>
      <div style={{
        background: 'var(--bark)', color: '#fff', borderRadius: 'var(--r-md)',
        padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>أرباح اليوم</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>345.00 ⃁</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>الطلبات</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>{store.partnerOrders.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.5)' }}>المخزون</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--caramel)' }}>87%</div>
        </div>
      </div>

      <div style={{
        background: isOpen ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `2px solid ${isOpen ? 'var(--green)' : 'var(--red)'}`,
        borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: '1.8rem' }}>{isOpen ? '🟢' : '🔴'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.95rem', fontWeight: 900, color: isOpen ? 'var(--green)' : 'var(--red)' }}>
            {isOpen ? 'المقهى مفتوح للطلبات' : 'المقهى مغلق'}
          </div>
          <div style={{ fontSize: '.72rem', color: isOpen ? '#4aaa7a' : '#e74c3c' }}>
            {isOpen ? 'الطلبات تصلك الآن' : 'لا تستقبل الطلبات حالياً'}
          </div>
        </div>
        <label style={{ position: 'relative', width: 50, height: 26, flexShrink: 0 }}>
          <input type="checkbox" checked={isOpen} onChange={() => setIsOpen(!isOpen)} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{
            position: 'absolute', inset: 0, borderRadius: 40, cursor: 'pointer',
            transition: '.25s', background: isOpen ? 'var(--green)' : 'var(--red)',
          }} />
        </label>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>الطلبات</button>
        <button className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>المخزون</button>
        <button className={`admin-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>الموظفون</button>
        <button className={`admin-tab ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => setActiveTab('promos')}>العروض</button>
      </div>

      {activeTab === 'orders' && <PartnerOrders />}
      {activeTab === 'inventory' && <PartnerInventory />}
      {activeTab === 'staff' && <PartnerStaff />}
      {activeTab === 'promos' && <PartnerPromos />}
    </div>
  );
}
