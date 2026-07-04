'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function PartnerPromos() {
  const store = useAppStore();
  const lang = store.lang;
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');

  const handleCreate = () => {
    if (!name || !discount) return;
    const current = useAppStore.getState().promos;
    useAppStore.setState({ promos: [...current, { name, discount: parseInt(discount), start: '07:00', end: '10:00', active: true }] });
    setName('');
    setDiscount('');
  };

  return (
    <div>
      <p className="section-title">{t('partner_promo_title', lang)}</p>
      <input className="form-input" placeholder={t('partner_promo_name_placeholder', lang)} value={name} onChange={(e) => setName(e.target.value)} />
      <input className="form-input" placeholder={t('partner_promo_discount_placeholder', lang)} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      <input className="form-input" placeholder={t('partner_promo_from_placeholder', lang)} />
      <input className="form-input" placeholder={t('partner_promo_to_placeholder', lang)} />
      <button className="action-btn" onClick={handleCreate}>{t('partner_promo_create', lang)}</button>

      <p className="section-title" style={{ marginTop: 16 }}>{t('partner_promo_active', lang)}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {store.promos.map((p, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--sh-sm)', borderRight: `3px solid ${p.active ? 'var(--green)' : 'var(--text-light)'}`,
          }}>
            <div>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{t('partner_promo_discount', lang)} {p.discount}% • {p.start} - {p.end}</div>
            </div>
            <span style={{
              fontSize: '.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: p.active ? 'var(--green-bg)' : 'var(--latte)',
              color: p.active ? 'var(--green)' : 'var(--text-light)',
            }}>{p.active ? t('partner_promo_active_label', lang) : t('partner_promo_inactive', lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
