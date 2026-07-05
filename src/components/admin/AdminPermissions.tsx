'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { PERMISSION_RESOURCES, getUserPermissions, upsertPermission, deletePermission } from '../../lib/pickme';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminPermissions() {
  const { lang } = useAppStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [perms, setPerms] = useState<Record<string, Record<string, { can_add: boolean; can_view: boolean; can_update: boolean; id?: string }>>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('id, first_name, last_name, email').neq('role', 'Super Admin').order('first_name').then(({ data }) => {
      if (data) setUsers(data as UserRow[]);
    });
    loadPerms();
  }, []);

  const loadPerms = async () => {
    const { data } = await supabase.from('user_permissions').select('*');
    if (data) {
      const grouped: Record<string, Record<string, any>> = {};
      for (const p of data) {
        if (!grouped[p.user_id]) grouped[p.user_id] = {};
        grouped[p.user_id][p.resource] = { can_add: p.can_add, can_view: p.can_view, can_update: p.can_update, id: p.id };
      }
      setPerms(grouped);
    }
  };

  const userPerms = selectedUser ? (perms[selectedUser] || {}) : {};

  const togglePerm = async (userId: string, resource: string, field: 'can_add' | 'can_view' | 'can_update') => {
    const current = perms[userId]?.[resource] || { can_add: false, can_view: false, can_update: false };
    const next = !current[field];
    setSaving(true);
    try {
      await upsertPermission(userId, resource, {
        ...current,
        [field]: next,
      });
      setPerms(prev => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          [resource]: { ...current, [field]: next },
        },
      }));
      setMsg(`✅ ${resource}.${field} = ${next}`);
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Error'));
    } finally { setSaving(false); }
  };

  const clearUserPerms = async () => {
    if (!selectedUser || !confirm('Clear all permissions for this user?')) return;
    const userPerms = perms[selectedUser] || {};
    for (const [res, p] of Object.entries(userPerms)) {
      if (p.id) await deletePermission(p.id).catch(() => {});
    }
    setPerms(prev => ({ ...prev, [selectedUser]: {} }));
    setMsg('✅ Permissions cleared');
  };

  return (
    <div className="admin-page" id="apPermissions">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>🔐 {lang === 'ar' ? 'إدارة الصلاحيات' : 'Permissions'}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="coffee-input" style={{ flex: 1, minWidth: 200 }}
          value={selectedUser || ''} onChange={(e) => setSelectedUser(e.target.value || null)}>
          <option value="">{lang === 'ar' ? 'اختر مستخدم...' : 'Select user...'}</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
          ))}
        </select>
        {selectedUser && (
          <button className="action-btn secondary" style={{ padding: '6px 12px', fontSize: '.75rem' }}
            onClick={clearUserPerms}>🗑️ {lang === 'ar' ? 'مسح الكل' : 'Clear All'}</button>
        )}
      </div>

      {msg && <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem', background: msg.includes('✅') ? 'var(--green-bg)' : 'var(--red-bg)', color: msg.includes('✅') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}

      {selectedUser && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'الموارد' : 'Resource'}</th>
                <th style={{ textAlign: 'center' }}>➕ {lang === 'ar' ? 'إضافة' : 'Add'}</th>
                <th style={{ textAlign: 'center' }}>👁️ {lang === 'ar' ? 'عرض' : 'View'}</th>
                <th style={{ textAlign: 'center' }}>✏️ {lang === 'ar' ? 'تحديث' : 'Update'}</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_RESOURCES.map(res => {
                const p = userPerms[res] || { can_add: false, can_view: false, can_update: false };
                const label = lang === 'ar'
                  ? ({ edit_cafes: 'تعديل المقاهي', edit_users: 'تعديل المستخدمين', edit_prices: 'تعديل الأسعار', edit_menus: 'تعديل القوائم', edit_orders: 'تعديل الطلبات', edit_promotions: 'تعديل العروض', edit_subscriptions: 'تعديل الاشتراكات', view_reports: 'عرض التقارير', view_analytics: 'عرض التحليلات', manage_staff: 'إدارة الموظفين' } as Record<string, string>)[res] || res
                  : res.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <tr key={res}>
                    <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{label}</td>
                    {(['can_add', 'can_view', 'can_update'] as const).map(field => (
                      <td key={field} style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={p[field]}
                          onChange={() => togglePerm(selectedUser, res, field)}
                          disabled={saving}
                          style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!selectedUser && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
          {lang === 'ar' ? 'اختر مستخدماً من القائمة أعلاه لإدارة صلاحياته' : 'Select a user above to manage their permissions'}
        </div>
      )}
    </div>
  );
}
