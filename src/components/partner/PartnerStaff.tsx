'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import type { Lang } from '../../types';
import { getStaff, addStaffMember, deleteStaffMember } from '../../lib/pickme';
import type { StaffRow } from '../../lib/pickme';

const roleLabel = (r: string, l: Lang) =>
  r === 'باريستا' || r === 'Barista' ? t('partner_staff_role_barista', l) :
  r === 'كاشير' || r === 'Cashier' ? t('partner_staff_role_cashier', l) :
  r === 'مدير' || r === 'Manager' ? t('partner_staff_role_manager', l) :
  r === 'owner' ? (l === 'ar' ? 'مالك' : 'Owner') :
  r === 'admin' ? (l === 'ar' ? 'مدير' : 'Admin') :
  r === 'supervisor' ? (l === 'ar' ? 'مشرف' : 'Supervisor') :
  r === 'staff' ? (l === 'ar' ? 'موظف' : 'Staff') :
  r === 'cashier' ? (l === 'ar' ? 'كاشير' : 'Cashier') :
  r === 'finance' ? (l === 'ar' ? 'مالية' : 'Finance') : r;

const shiftLabel = (s: string, l: Lang) =>
  s === 'صباحي' || s === 'Morning' ? t('partner_staff_shift_morning', l) :
  s === 'مسائي' || s === 'Evening' ? t('partner_staff_shift_evening', l) :
  s === 'يوم كامل' || s === 'Full Day' ? t('partner_staff_shift_full', l) : s;

const PARTNER_ROLES = ['owner', 'admin', 'supervisor', 'staff', 'cashier', 'finance'];

export default function PartnerStaff({ cafeId, partnerRole }: { cafeId: string | null; partnerRole: string }) {
  const store = useAppStore();
  const lang = store.lang;
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('staff');
  const [shift, setShift] = useState('صباحي');
  const [loading, setLoading] = useState(false);

  const canEdit = partnerRole === 'owner' || partnerRole === 'admin';

  useEffect(() => {
    if (!cafeId) return;
    setLoading(true);
    getStaff(cafeId).then(({ data }) => {
      if (data) setStaff(data as StaffRow[]);
      setLoading(false);
    });
  }, [cafeId]);

  const handleAdd = async () => {
    if (!canEdit || !cafeId || !name.trim()) return;
    const { data } = await addStaffMember(cafeId, { name: name.trim(), role, shift });
    if (data) setStaff(prev => [...prev, data as StaffRow]);
    setName('');
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    await deleteStaffMember(id);
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const todayStaff = staff.filter(s => s.shift === getTodayShift());

  function getTodayShift(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباحي';
    if (hour < 18) return 'يوم كامل';
    return 'مسائي';
  }

  if (!cafeId) return (
    <div>
      <p className="section-title">{t('partner_staff_title', lang)}</p>
      <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>
        {lang === 'ar' ? 'لم يتم تعيين مقهى' : 'No cafe assigned'}
      </p>
    </div>
  );

  return (
    <div>
      <p className="section-title">{t('partner_staff_title', lang)}</p>

      {canEdit && (
        <div className="emp-add-form">
          <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 10 }}>{t('partner_add_staff', lang)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <input className="form-input" placeholder={t('partner_staff_name_placeholder', lang)} style={{ margin: 0 }} value={name} onChange={(e) => setName(e.target.value)} />
            <select className="form-input" style={{ margin: 0 }} value={role} onChange={(e) => setRole(e.target.value)}>
              {PARTNER_ROLES.map(r => (
                <option key={r} value={r}>{roleLabel(r, lang)}</option>
              ))}
            </select>
            <select className="form-input" style={{ margin: 0 }} value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="صباحي">{t('partner_staff_shift_morning', lang)}</option>
              <option value="مسائي">{t('partner_staff_shift_evening', lang)}</option>
              <option value="يوم كامل">{t('partner_staff_shift_full', lang)}</option>
            </select>
          </div>
          <button className="action-btn green-btn" style={{ fontSize: '.85rem', padding: 8 }} onClick={handleAdd}>{t('partner_add_staff_btn', lang)}</button>
        </div>
      )}

      <p className="section-title">{partnerRole === 'staff' ? (lang === 'ar' ? 'فريق اليوم' : "Today's Staff") : t('partner_staff_today', lang)}</p>
      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(partnerRole === 'staff' ? todayStaff : staff).map((s) => (
            <div key={s.id} className="emp-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
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
              {canEdit && <button className="emp-delete-btn" onClick={() => handleDelete(s.id)}>🗑️</button>}
            </div>
          ))}
          {staff.length === 0 && (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 10 }}>{lang === 'ar' ? 'لا يوجد موظفون' : 'No staff members'}</p>
          )}
        </div>
      )}
    </div>
  );
}
