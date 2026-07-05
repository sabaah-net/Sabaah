'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, createCafe, updateCafe, addAuditLog } from '../../lib/supabase';
import { uploadCafeLogo, deleteCafeLogo } from '../../lib/pickme';
import { t } from '../../i18n';

interface CafeRow {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  email: string | null;
  emoji: string;
  logo_url: string | null;
  status: string;
  is_open: boolean;
  rating: number;
  city: string;
  avg_wait_min: number;
  created_at: string;
}

export default function AdminPartners() {
  const { lang, loadFromSupabase } = useAppStore();
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name_ar: '', name_en: '', location: '', city: 'riyadh', email: '', emoji: '☕', status: 'active', is_open: true, avg_wait_min: 5 });
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCafes = async () => {
    const { data, error: err } = await supabase.from('cafes').select('*').order('created_at', { ascending: false });
    if (!err && data) setCafes(data as CafeRow[]);
  };

  useEffect(() => { fetchCafes(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name_ar: '', name_en: '', location: '', city: 'riyadh', email: '', emoji: '☕', status: 'active', is_open: true, avg_wait_min: 5 });
    setModalMode('add');
    setError(''); setSuccess('');
  };

  const openEdit = (c: CafeRow) => {
    setEditId(c.id);
    setForm({ name_ar: c.name_ar, name_en: c.name_en, location: c.location, city: c.city, email: c.email || '', emoji: c.emoji, status: c.status, is_open: c.is_open, avg_wait_min: c.avg_wait_min });
    setModalMode('edit');
    setError(''); setSuccess('');
  };

  const handleLogoUpload = async (cafeId: string) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCafeLogo(cafeId, file);
      setSuccess('✅ Logo uploaded');
      fetchCafes();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDeleteLogo = async (cafeId: string) => {
    if (!confirm('Delete logo?')) return;
    await deleteCafeLogo(cafeId);
    fetchCafes();
  };

  const handleSave = async () => {
    if (!form.name_ar) { setError(t('err_name_required', lang)); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (modalMode === 'add') {
        const user = useAppStore.getState().currentUser;
        const { error: err } = await createCafe({
          owner_id: user?.profileId || null,
          name_ar: form.name_ar,
          name_en: form.name_en || form.name_ar,
          location: form.location || t('admin_default_city', lang),
          city: form.city,
          email: form.email || null,
          emoji: form.emoji,
          status: form.status,
          is_open: form.is_open,
          rating: 0,
          total_favorites: 0,
          avg_wait_min: form.avg_wait_min,
          inventory_enabled: true,
        });
        if (err) throw err;
        setSuccess(t('cafe_added_success', lang).replace('{name}', form.name_ar));
      } else if (modalMode === 'edit' && editId) {
        const { error: err } = await updateCafe(editId, {
          name_ar: form.name_ar,
          name_en: form.name_en || form.name_ar,
          location: form.location,
          city: form.city,
          email: form.email || null,
          emoji: form.emoji,
          status: form.status,
          is_open: form.is_open,
          avg_wait_min: form.avg_wait_min,
        });
        if (err) throw err;
        setSuccess(`✅ ${form.name_ar} updated`);
      }

      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `${modalMode === 'add' ? 'Add' : 'Edit'} cafe: ${form.name_ar}`,
        action_type: 'create',
        details: `${modalMode === 'add' ? 'Added' : 'Edited'} cafe ${form.name_ar}`,
      }).catch(() => {});

      setModalMode(null);
      fetchCafes();
      loadFromSupabase();
    } catch (e: any) {
      setError(e.message || t('err_add_cafe_failed', lang));
    } finally { setLoading(false); }
  };

  const handleToggleStatus = async (c: CafeRow) => {
    const newStatus = c.status === 'active' ? 'suspended' : 'active';
    const { error: err } = await updateCafe(c.id, { status: newStatus });
    if (err) return;
    fetchCafes();
    loadFromSupabase();
  };

  return (
    <div className="admin-page" id="apPartners">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('partner_title', lang)}</div>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '.8rem' }} onClick={openAdd}>{t('add_cafe_btn', lang)}</button>
      </div>

      {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontSize: '.85rem' }}>{success}</div>}
      {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontSize: '.85rem' }}>{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>{t('name', lang)}</th><th>English</th><th>{t('email', lang)}</th><th>{t('th_city', lang)}</th><th>Logo</th><th>{t('status', lang)}</th><th>{t('th_actions', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {cafes.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_cafes', lang)}</td></tr>
            )}
            {cafes.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td><strong>{c.emoji} {c.name_ar}</strong></td>
                <td style={{ color: 'var(--text-light)' }}>{c.name_en || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.city}</td>
                <td>
                  {c.logo_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <img src={c.logo_url} alt="logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                      <button className="action-btn secondary" style={{ padding: '2px 6px', fontSize: '.6rem' }} onClick={() => handleDeleteLogo(c.id)}>✕</button>
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <span className={`table-badge badge-${c.status === 'active' ? 'green' : 'amber'}`}
                    style={{ cursor: 'pointer' }} onClick={() => handleToggleStatus(c)}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.72rem', margin: 0 }}
                    onClick={() => openEdit(c)}>
                    ✏️ {t('edit', lang) || 'Edit'}
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
            <div className="modal-title">{modalMode === 'add' ? t('add_cafe_modal_title', lang) : `✏️ ${t('edit', lang) || 'Edit'} ${form.name_ar}`}</div>
            {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
            <input className="coffee-input" placeholder={t('f_name_ar', lang)} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_name_en', lang)} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_location', lang)} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_city', lang) || 'City'} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_email', lang)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_emoji', lang)} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />

            {modalMode === 'edit' && editId && (
              <div style={{ margin: '8px 0' }}>
                <div style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 4 }}>🖼️ {lang === 'ar' ? 'شعار المقهى' : 'Cafe Logo'} (SVG/PNG/JPEG/JPG/PDF, max 3MB)</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input ref={fileRef} type="file" accept=".svg,.png,.jpg,.jpeg,.pdf" style={{ fontSize: '.75rem', flex: 1 }} />
                  <button className="action-btn secondary" style={{ padding: '6px 12px', fontSize: '.72rem' }} disabled={uploading} onClick={() => handleLogoUpload(editId)}>
                    {uploading ? '...' : '⬆️ Upload'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0' }}>
              <label style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
                {t('partner_open', lang) || 'Open'}
              </label>
              <label style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('wait_min', lang) || 'Wait (min)'}
                <input type="number" className="coffee-input" style={{ width: 60 }} value={form.avg_wait_min} onChange={(e) => setForm({ ...form, avg_wait_min: parseInt(e.target.value) || 5 })} />
              </label>
            </div>
            <select className="coffee-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <button className="action-btn" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSave}>
              {loading ? t('cafe_saving', lang) : modalMode === 'add' ? t('cafe_add', lang) : `💾 ${t('save_btn', lang)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
