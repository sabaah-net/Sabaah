'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, updateProfile, updateProfileRole, addAuditLog } from '../../lib/supabase';
import { t } from '../../i18n';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  wallet_balance: number;
  city: string;
  last_login: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const { lang } = useAppStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'edit' | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ role: '', status: '', wallet_balance: 0, city: '' });

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserRow[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return fullName.includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({ role: u.role, status: u.status, wallet_balance: u.wallet_balance, city: u.city });
    setModalMode('edit'); setError(''); setSuccess('');
  };

  const handleSave = async () => {
    if (!editUser) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (form.role !== editUser.role) {
        const { error: err } = await updateProfileRole(editUser.id, form.role);
        if (err) throw err;
      }
      const { error: err } = await updateProfile(editUser.id, {
        status: form.status,
        wallet_balance: form.wallet_balance,
        city: form.city,
      });
      if (err) throw err;

      addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `Edit user: ${editUser.first_name} ${editUser.last_name}`,
        action_type: 'user',
        details: `Role: ${editUser.role} → ${form.role}, Status: ${editUser.status} → ${form.status}`,
      }).catch(() => {});

      setSuccess(`✅ ${editUser.first_name} ${editUser.last_name} ${t('admin_settings_saved', lang) || 'updated'}`);
      setModalMode(null);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || t('error_generic', lang));
    } finally { setLoading(false); }
  };

  const statusLabel: Record<string, string> = {
    active: t('active', lang), suspended: t('suspended', lang), banned: t('banned', lang),
  };

  return (
    <div className="admin-page" id="apUsers">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('user_management', lang)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="admin-search" placeholder={t('search_users', lang)} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>{t('name', lang)}</th><th>{t('phone', lang)}</th><th>{t('email', lang)}</th><th>{t('role', lang)}</th><th>{t('status', lang)}</th><th>{t('wallet_col', lang)}</th><th>{t('last_login', lang)}</th><th>{t('th_actions', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_results', lang)}</td></tr>
            )}
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td dir="ltr" style={{ fontSize: '.82rem' }}>{u.phone || '-'}</td>
                <td>{u.email}</td>
                <td><span className={`table-badge badge-${u.role === 'Partner' ? 'blue' : u.role === 'Super Admin' || u.role === 'Admin' ? 'amber' : 'green'}`}>{u.role}</span></td>
                <td><span className={`table-badge badge-${u.status === 'active' ? 'green' : 'red'}`} style={{ cursor: 'pointer' }}>{statusLabel[u.status] || u.status}</span></td>
                <td>{(u.wallet_balance || 0).toFixed(2)} ⃁</td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.72rem', margin: 0 }}
                    onClick={() => openEdit(u)}>
                    ✏️ {t('edit', lang)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode === 'edit' && editUser && (
        <div className="modal-overlay open" onClick={() => setModalMode(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">✏️ {t('edit', lang)}: {editUser.first_name} {editUser.last_name}</div>
            {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
            {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{success}</div>}

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block' }}>{t('role', lang)}</label>
            <select className="coffee-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Customer">Customer</option>
              <option value="Partner">Partner</option>
              <option value="Admin">Admin</option>
            </select>

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('status', lang)}</label>
            <select className="coffee-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('active', lang)}</option>
              <option value="suspended">{t('suspended', lang)}</option>
              <option value="banned">{t('banned', lang)}</option>
            </select>

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('wallet_col', lang)}</label>
            <input className="coffee-input" type="number" step="0.01" value={form.wallet_balance} onChange={(e) => setForm({ ...form, wallet_balance: Number(e.target.value) })} />

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('f_city', lang)}</label>
            <input className="coffee-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />

            <button className="action-btn" style={{ width: '100%', marginTop: 12, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSave}>
              {loading ? t('report_loading', lang) : `💾 ${t('save_btn', lang)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
