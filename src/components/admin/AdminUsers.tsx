'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, updateProfile, updateProfileRole, addAuditLog, createProfile, signUp as supabaseSignUp } from '../../lib/supabase';
import { updateUserWalletAndPoints, getAvailableOwners, assignCafeOwner } from '../../lib/pickme';
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
  loyalty_points: number;
  city: string;
  last_login: string | null;
  created_at: string;
}

interface CafeOption {
  id: string;
  name_ar: string;
  owner_id: string | null;
}

export default function AdminUsers() {
  const { lang } = useAppStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'Customer', partner_role: '', sabaa_role: '', status: 'active', wallet_balance: 0, loyalty_points: 0, city: '', assignedCafeId: '' });

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserRow[]);
    const { data: c } = await supabase.from('cafes').select('id, name_ar, owner_id');
    if (c) setCafes(c as CafeOption[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return fullName.includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    const assigned = cafes.find(c => c.owner_id === u.id);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone || '', password: '', role: u.role, partner_role: (u as any).partner_role || '', sabaa_role: (u as any).sabaa_role || '', status: u.status, wallet_balance: u.wallet_balance, loyalty_points: u.loyalty_points, city: u.city, assignedCafeId: assigned?.id || '' });
    setModalMode('edit'); setError(''); setSuccess('');
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'Customer', partner_role: '', sabaa_role: '', status: 'active', wallet_balance: 0, loyalty_points: 0, city: 'riyadh', assignedCafeId: '' });
    setModalMode('create'); setError(''); setSuccess('');
  };

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      if (modalMode === 'create') {
        if (!form.first_name || !form.email || !form.password) {
          setError(t('error_email_password', lang));
          setLoading(false); return;
        }
        const { data: authData, error: authError } = await supabaseSignUp(form.email, form.password, { first_name: form.first_name, last_name: form.last_name });
        if (authError) throw authError;
        const authUserId = authData?.user?.id;
        if (!authUserId) throw new Error('User creation failed');

        const { error: profileError } = await createProfile({
          auth_id: authUserId,
          phone: form.phone,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        });
        if (profileError) throw profileError;

        const extra: any = {};
        if (form.role === 'Partner') extra.partner_role = form.partner_role || null;
        else if (form.role === 'Sabaa') extra.sabaa_role = form.sabaa_role || null;
        await supabase.from('profiles').update({ status: form.status, wallet_balance: form.wallet_balance, loyalty_points: form.loyalty_points, city: form.city, ...extra }).eq('id', authUserId);
        await supabase.from('profiles').update({ password: form.password }).eq('auth_id', authUserId);

        if (form.assignedCafeId) {
          await assignCafeOwner(form.assignedCafeId, authUserId);
        }

        addAuditLog({ user_name: t('audit_supervisor', lang), action_ar: `Create user: ${form.first_name} ${form.last_name}`, action_type: 'user', details: `Role: ${form.role}` }).catch(() => {});
        setSuccess(`✅ ${form.first_name} ${form.last_name} created`);
      } else if (modalMode === 'edit' && editUser) {
        if (form.role !== editUser.role) {
          const { error: err } = await updateProfileRole(editUser.id, form.role);
          if (err) throw err;
        }
        const extra: any = {};
        if (form.role === 'Partner') extra.partner_role = form.partner_role || null;
        else if (form.role === 'Sabaa') extra.sabaa_role = form.sabaa_role || null;
        else { extra.partner_role = null; extra.sabaa_role = null; }
        await updateProfile(editUser.id, { status: form.status, city: form.city, ...extra });
        await updateUserWalletAndPoints(editUser.id, form.wallet_balance, form.loyalty_points);

        if (form.assignedCafeId) {
          const currentOwner = cafes.find(c => c.id === form.assignedCafeId)?.owner_id;
          if (currentOwner !== editUser.id) {
            await assignCafeOwner(form.assignedCafeId, editUser.id);
          }
        }

        addAuditLog({ user_name: t('audit_supervisor', lang), action_ar: `Edit user: ${editUser.first_name} ${editUser.last_name}`, action_type: 'user', details: `Role: ${editUser.role} → ${form.role}` }).catch(() => {});
        setSuccess(`✅ ${editUser.first_name} ${editUser.last_name} updated`);
      }

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
          <button className="action-btn" style={{ width: 'auto', padding: '8px 14px', fontSize: '.8rem' }} onClick={openCreate}>➕ {t('add_cafe_btn', lang).replace('مقهى', 'User').replace('Cafe', 'User')}</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>{t('name', lang)}</th><th>{t('phone', lang)}</th><th>{t('email', lang)}</th><th>{t('role', lang)}</th><th>{t('status', lang)}</th><th>{t('wallet_col', lang)}</th><th>{t('Points', lang) || '⭐ Points'}</th><th>{t('last_login', lang)}</th><th>{t('th_actions', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_results', lang)}</td></tr>
            )}
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td dir="ltr" style={{ fontSize: '.82rem' }}>{u.phone || '-'}</td>
                <td>{u.email}</td>
                <td><span className={`table-badge badge-${u.role === 'Partner' ? 'blue' : u.role === 'Sabaa' ? 'amber' : 'green'}`}>{u.role}</span></td>
                <td><span className={`table-badge badge-${u.status === 'active' ? 'green' : 'red'}`}>{statusLabel[u.status] || u.status}</span></td>
                <td>﷼ {(u.wallet_balance || 0).toFixed(2)}</td>
                <td>⭐ {u.loyalty_points || 0}</td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString('en-US') : '-'}</td>
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

      {modalMode && (
        <div className="modal-overlay open" onClick={() => setModalMode(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{modalMode === 'create' ? '➕ ' + t('register_tab', lang) : `✏️ ${t('edit', lang)}: ${editUser?.first_name || ''}`}</div>
            {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
            {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{success}</div>}

            {modalMode === 'create' && (
              <>
                <input className="coffee-input" placeholder={t('name_placeholder', lang)} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <input className="coffee-input" placeholder={t('f_name_en', lang) || 'Last Name'} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                <input className="coffee-input" placeholder={t('phone_placeholder', lang)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="coffee-input" type="email" placeholder={t('email_placeholder', lang)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className="coffee-input" type="password" placeholder={t('password_placeholder', lang)} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </>
            )}

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: modalMode === 'edit' ? 0 : 8 }}>{t('role', lang)}</label>
            <select className="coffee-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, partner_role: '', sabaa_role: '' })}>
              <option value="Customer">Customer</option>
              <option value="Partner">Partner</option>
              <option value="Sabaa">Sabaa</option>
            </select>

            {form.role === 'Partner' && (
              <>
                <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>Partner Role</label>
                <select className="coffee-input" value={form.partner_role} onChange={(e) => setForm({ ...form, partner_role: e.target.value })}>
                  <option value="">— None —</option>
                  {editUser && (editUser as any).partner_role && !['owner','finance','supervisor','staff','cashier'].includes((editUser as any).partner_role) && (
                    <option value={(editUser as any).partner_role}>{(editUser as any).partner_role}</option>
                  )}
                  <option value="owner">Owner</option>
                  <option value="finance">Finance</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="staff">Staff</option>
                  <option value="cashier">Cashier</option>
                </select>
              </>
            )}

            {form.role === 'Sabaa' && (
              <>
                <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>Sabaa Role</label>
                <select className="coffee-input" value={form.sabaa_role} onChange={(e) => setForm({ ...form, sabaa_role: e.target.value })}>
                  <option value="">— None —</option>
                  {editUser && (editUser as any).sabaa_role && !['super_admin','finance','admin','operations','customer_care','sales','marketing'].includes((editUser as any).sabaa_role) && (
                    <option value={(editUser as any).sabaa_role}>{(editUser as any).sabaa_role}</option>
                  )}
                  <option value="super_admin">Super Admin</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                  <option value="operations">Operations</option>
                  <option value="customer_care">Customer Care</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                </select>
              </>
            )}

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('status', lang)}</label>
            <select className="coffee-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('active', lang)}</option>
              <option value="suspended">{t('suspended', lang)}</option>
              <option value="banned">{t('banned', lang)}</option>
            </select>

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('wallet_col', lang)}</label>
            <input className="coffee-input" type="number" step="0.01" value={form.wallet_balance} onChange={(e) => setForm({ ...form, wallet_balance: Number(e.target.value) })} />

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>⭐ Loyalty Points</label>
            <input className="coffee-input" type="number" step="1" value={form.loyalty_points} onChange={(e) => setForm({ ...form, loyalty_points: Number(e.target.value) })} />

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>🏪 Assign Cafe (for Partner)</label>
            <select className="coffee-input" value={form.assignedCafeId} onChange={(e) => setForm({ ...form, assignedCafeId: e.target.value })}>
              <option value="">{lang === 'ar' ? '— لا يوجد' : '— None'}</option>
              {cafes.map(c => (
                <option key={c.id} value={c.id}>{c.name_ar} {c.owner_id ? '(taken)' : ''}</option>
              ))}
            </select>

            <label style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4, display: 'block', marginTop: 8 }}>{t('f_city', lang)}</label>
            <input className="coffee-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />

            <button className="action-btn" style={{ width: '100%', marginTop: 12, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSave}>
              {loading ? t('report_loading', lang) : (modalMode === 'create' ? '✅ ' + t('create_account', lang) : `💾 ${t('save_btn', lang)}`)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
