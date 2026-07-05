'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { addAuditLog } from '../../lib/supabase';

const RESOURCES = [
  { key: 'edit_cafes', ar: 'تعديل المقاهي', en: 'Edit Cafes' },
  { key: 'edit_users', ar: 'تعديل المستخدمين', en: 'Edit Users' },
  { key: 'edit_prices', ar: 'تعديل الأسعار', en: 'Edit Prices' },
  { key: 'edit_menus', ar: 'تعديل القوائم', en: 'Edit Menus' },
  { key: 'edit_orders', ar: 'تعديل الطلبات', en: 'Edit Orders' },
  { key: 'edit_promotions', ar: 'تعديل العروض', en: 'Edit Promotions' },
  { key: 'edit_subscriptions', ar: 'تعديل الاشتراكات', en: 'Edit Subscriptions' },
  { key: 'view_reports', ar: 'عرض التقارير', en: 'View Reports' },
  { key: 'view_analytics', ar: 'عرض التحليلات', en: 'View Analytics' },
  { key: 'manage_staff', ar: 'إدارة الموظفين', en: 'Manage Staff' },
];

const SABAA_ROLES = [
  { key: 'super_admin', ar: '_super admin', en: 'Super Admin' },
  { key: 'finance', ar: 'المالية', en: 'Finance' },
  { key: 'admin', ar: 'الأدمن', en: 'Admin' },
  { key: 'operations', ar: 'العمليات', en: 'Operations' },
  { key: 'customer_care', ar: 'خدمة العملاء', en: 'Customer Care' },
  { key: 'sales', ar: 'المبيعات', en: 'Sales' },
  { key: 'marketing', ar: 'التسويق', en: 'Marketing' },
];

const PARTNER_ROLES = [
  { key: 'owner', ar: 'المالك', en: 'Owner' },
  { key: 'finance', ar: 'المالية', en: 'Finance' },
  { key: 'supervisor', ar: 'المشرف', en: 'Supervisor' },
  { key: 'staff', ar: 'الموظف', en: 'Staff' },
  { key: 'cashier', ar: 'الكاشير', en: 'Cashier' },
];

const DEFAULT_PERMS: Record<string, Record<string, { can_add: boolean; can_view: boolean; can_update: boolean }>> = {
  super_admin: Object.fromEntries(RESOURCES.map(r => [r.key, { can_add: true, can_view: true, can_update: true }])),
  finance: {
    edit_cafes: { can_add: false, can_view: false, can_update: false },
    edit_users: { can_add: false, can_view: false, can_update: false },
    edit_prices: { can_add: false, can_view: true, can_update: true },
    edit_menus: { can_add: false, can_view: false, can_update: false },
    edit_orders: { can_add: false, can_view: false, can_update: false },
    edit_promotions: { can_add: false, can_view: false, can_update: false },
    edit_subscriptions: { can_add: false, can_view: true, can_update: true },
    view_reports: { can_add: false, can_view: true, can_update: false },
    view_analytics: { can_add: false, can_view: true, can_update: false },
    manage_staff: { can_add: false, can_view: false, can_update: false },
  },
  admin: {
    edit_cafes: { can_add: true, can_view: true, can_update: true },
    edit_users: { can_add: true, can_view: true, can_update: true },
    edit_prices: { can_add: false, can_view: true, can_update: false },
    edit_menus: { can_add: true, can_view: true, can_update: true },
    edit_orders: { can_add: true, can_view: true, can_update: true },
    edit_promotions: { can_add: true, can_view: true, can_update: true },
    edit_subscriptions: { can_add: false, can_view: false, can_update: false },
    view_reports: { can_add: false, can_view: true, can_update: false },
    view_analytics: { can_add: false, can_view: true, can_update: false },
    manage_staff: { can_add: true, can_view: true, can_update: true },
  },
  operations: {
    edit_cafes: { can_add: false, can_view: true, can_update: true },
    edit_users: { can_add: false, can_view: false, can_update: false },
    edit_prices: { can_add: false, can_view: false, can_update: false },
    edit_menus: { can_add: false, can_view: false, can_update: false },
    edit_orders: { can_add: true, can_view: true, can_update: true },
    edit_promotions: { can_add: false, can_view: false, can_update: false },
    edit_subscriptions: { can_add: false, can_view: false, can_update: false },
    view_reports: { can_add: false, can_view: true, can_update: false },
    view_analytics: { can_add: false, can_view: false, can_update: false },
    manage_staff: { can_add: true, can_view: true, can_update: true },
  },
  customer_care: {
    edit_cafes: { can_add: false, can_view: false, can_update: false },
    edit_users: { can_add: false, can_view: false, can_update: false },
    edit_prices: { can_add: false, can_view: false, can_update: false },
    edit_menus: { can_add: false, can_view: false, can_update: false },
    edit_orders: { can_add: false, can_view: true, can_update: true },
    edit_promotions: { can_add: false, can_view: false, can_update: false },
    edit_subscriptions: { can_add: false, can_view: false, can_update: false },
    view_reports: { can_add: false, can_view: true, can_update: false },
    view_analytics: { can_add: false, can_view: false, can_update: false },
    manage_staff: { can_add: false, can_view: false, can_update: false },
  },
  sales: {
    edit_cafes: { can_add: false, can_view: false, can_update: false },
    edit_users: { can_add: false, can_view: false, can_update: false },
    edit_prices: { can_add: false, can_view: false, can_update: false },
    edit_menus: { can_add: false, can_view: false, can_update: false },
    edit_orders: { can_add: false, can_view: false, can_update: false },
    edit_promotions: { can_add: true, can_view: true, can_update: true },
    edit_subscriptions: { can_add: false, can_view: false, can_update: false },
    view_reports: { can_add: false, can_view: true, can_update: false },
    view_analytics: { can_add: false, can_view: true, can_update: false },
    manage_staff: { can_add: false, can_view: false, can_update: false },
  },
  marketing: {
    edit_cafes: { can_add: false, can_view: false, can_update: false },
    edit_users: { can_add: false, can_view: false, can_update: false },
    edit_prices: { can_add: false, can_view: false, can_update: false },
    edit_menus: { can_add: false, can_view: false, can_update: false },
    edit_orders: { can_add: false, can_view: false, can_update: false },
    edit_promotions: { can_add: true, can_view: true, can_update: true },
    edit_subscriptions: { can_add: false, can_view: false, can_update: false },
    view_reports: { can_add: false, can_view: false, can_update: false },
    view_analytics: { can_add: false, can_view: true, can_update: false },
    manage_staff: { can_add: false, can_view: false, can_update: false },
  },
};

function loadPerms(): Record<string, Record<string, { can_add: boolean; can_view: boolean; can_update: boolean }>> {
  try {
    const raw = localStorage.getItem('sabaa_role_perms');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PERMS;
}

function savePerms(perms: Record<string, Record<string, { can_add: boolean; can_view: boolean; can_update: boolean }>>) {
  localStorage.setItem('sabaa_role_perms', JSON.stringify(perms));
}

export default function AdminPermissions() {
  const { lang } = useAppStore();
  const [pane, setPane] = useState<'sabaa' | 'partner'>('sabaa');
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [perms, setPerms] = useState(loadPerms);
  const [msg, setMsg] = useState('');

  const roles = pane === 'sabaa' ? SABAA_ROLES : PARTNER_ROLES;
  const currentPerms = perms[selectedRole] || {};

  const toggle = (resource: string, field: 'can_add' | 'can_view' | 'can_update') => {
    const updated = { ...perms };
    if (!updated[selectedRole]) updated[selectedRole] = {};
    if (!updated[selectedRole][resource]) updated[selectedRole][resource] = { can_add: false, can_view: false, can_update: false };
    updated[selectedRole][resource] = {
      ...updated[selectedRole][resource],
      [field]: !updated[selectedRole][resource][field],
    };
    setPerms(updated);
    savePerms(updated);
  };

  const handleSave = async () => {
    await addAuditLog({
      user_name: 'Admin',
      action_ar: `Updated permissions for role: ${selectedRole}`,
      action_type: 'update',
      details: JSON.stringify(perms[selectedRole]),
    }).catch(() => {});
    setMsg(`✅ ${lang === 'ar' ? 'تم الحفظ' : 'Saved'}`);
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div className="admin-page" id="apPermissions">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>
        🔐 {lang === 'ar' ? 'إدارة الصلاحيات' : 'Permissions'}
      </div>

      <div className="admin-tabs" style={{ margin: '0 0 16px' }}>
        <button className={`admin-tab ${pane === 'sabaa' ? 'active' : ''}`} onClick={() => { setPane('sabaa'); setSelectedRole(SABAA_ROLES[0].key); }}>
          🏛️ {lang === 'ar' ? 'صلاحيات سبأ' : 'Sabaa Roles'}
        </button>
        <button className={`admin-tab ${pane === 'partner' ? 'active' : ''}`} onClick={() => { setPane('partner'); setSelectedRole(PARTNER_ROLES[0].key); }}>
          🏪 {lang === 'ar' ? 'صلاحيات الشركاء' : 'Partner Roles'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{lang === 'ar' ? 'الدور:' : 'Role:'}</span>
        <select className="coffee-input" style={{ width: 220, margin: 0 }} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          {roles.map(r => (
            <option key={r.key} value={r.key}>{lang === 'ar' ? r.ar : r.en}</option>
          ))}
        </select>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 20px', fontSize: '.8rem' }} onClick={handleSave}>
          💾 {lang === 'ar' ? 'حفظ' : 'Save'}
        </button>
        {msg && <span style={{ fontSize: '.82rem', fontWeight: 700 }}>{msg}</span>}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>{lang === 'ar' ? 'الموارد' : 'Resource'}</th>
              <th style={{ textAlign: 'center', width: 80 }}>➕ {lang === 'ar' ? 'إضافة' : 'Add'}</th>
              <th style={{ textAlign: 'center', width: 80 }}>👁️ {lang === 'ar' ? 'عرض' : 'View'}</th>
              <th style={{ textAlign: 'center', width: 80 }}>✏️ {lang === 'ar' ? 'تحديث' : 'Update'}</th>
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map(res => {
              const p = currentPerms[res.key] || { can_add: false, can_view: false, can_update: false };
              return (
                <tr key={res.key}>
                  <td style={{ fontWeight: 700, fontSize: '.85rem' }}>{lang === 'ar' ? res.ar : res.en}</td>
                  {(['can_add', 'can_view', 'can_update'] as const).map(field => (
                    <td key={field} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={p[field]}
                        onChange={() => toggle(res.key, field)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--green)' }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}