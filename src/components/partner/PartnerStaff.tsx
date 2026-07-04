'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import type { Lang } from '../../types';

const roleLabel = (r: string, l: Lang) =>
  r === 'باريستا' || r === 'Barista' ? t('partner_staff_role_barista', l) :
  r === 'كاشير' || r === 'Cashier' ? t('partner_staff_role_cashier', l) :
  r === 'مدير' || r === 'Manager' ? t('partner_staff_role_manager', l) : r;

const shiftLabel = (s: string, l: Lang) =>
  s === 'صباحي' || s === 'Morning' ? t('partner_staff_shift_morning', l) :
  s === 'مسائي' || s === 'Evening' ? t('partner_staff_shift_evening', l) :
  s === 'يوم كامل' || s === 'Full Day' ? t('partner_staff_shift_full', l) : s;

export default function PartnerStaff() {
  const store = useAppStore();
  const lang = store.lang;
  const [name, setName] = useState('');
  const [role, setRole] = useState('باريستا');
  const [shift, setShift] = useState('صباحي');

  const handleAdd = () => {
    if (!name.trim()) return;
    const current = useAppStore.getState().staff;
    useAppStore.setState({ staff: [...current, { name, role, shift, status: 'active' }] });
    setName('');
  };

  return (
    <div>
      <p className="section-title">{t('partner_staff_title', lang)}</p>

      <div className="emp-add-form">
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 10 }}>{t('partner_add_staff', lang)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <input className="form-input" placeholder={t('partner_staff_name_placeholder', lang)} style={{ margin: 0 }} value={name} onChange={(e) => setName(e.target.value)} />
          <select className="form-input" style={{ margin: 0 }} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="باريستا">{t('partner_staff_role_barista', lang)}</option>
            <option value="كاشير">{t('partner_staff_role_cashier', lang)}</option>
            <option value="مدير">{t('partner_staff_role_manager', lang)}</option>
          </select>
          <select className="form-input" style={{ margin: 0 }} value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="صباحي">{t('partner_staff_shift_morning', lang)}</option>
            <option value="مسائي">{t('partner_staff_shift_evening', lang)}</option>
            <option value="يوم كامل">{t('partner_staff_shift_full', lang)}</option>
          </select>
        </div>
        <button className="action-btn green-btn" style={{ fontSize: '.85rem', padding: 8 }} onClick={handleAdd}>{t('partner_add_staff_btn', lang)}</button>
      </div>

      <p className="section-title">{t('partner_staff_today', lang)}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {store.staff.map((s, i) => (
          <div key={i} className="emp-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--latte)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.9rem',
              }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{roleLabel(s.role, lang)} • {shiftLabel(s.shift, lang)}</div>
              </div>
            </div>
            <button className="emp-delete-btn" onClick={() => {
              useAppStore.setState({ staff: useAppStore.getState().staff.filter((_, idx) => idx !== i) });
            }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
