'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, createCafe, addAuditLog } from '../../lib/supabase';
import { t } from '../../i18n';

export default function AdminPartners() {
  const { cafes, lang } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', nameEn: '', location: '', email: '', emoji: '☕', serviceType: 'قهوة', status: 'active' });

  const handleAdd = async () => {
    if (!form.name) { setError(t('err_name_required', lang)); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const user = useAppStore.getState().currentUser;
      const { data, error: err } = await createCafe({
        owner_id: user?.profileId || null,
        name_ar: form.name,
        name_en: form.nameEn || form.name,
        description: null,
        location: form.location || 'الرياض',
        city: 'riyadh',
        email: form.email || null,
        emoji: form.emoji,
        status: form.status,
        is_open: true,
        rating: 0,
        total_favorites: 0,
        avg_wait_min: 5,
        inventory_enabled: true,
      });
      if (err) throw err;
      if (!data) throw new Error('لم يتم إنشاء المقهى');

      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `إضافة مقهى جديد: ${form.name}`,
        action_type: 'create',
        details: `تمت إضافة ${form.name}`,
      }).catch(() => {});

      setSuccess(t('cafe_added_success', lang).replace('{name}', form.name));
      setShowModal(false);
      setForm({ name: '', nameEn: '', location: '', email: '', emoji: '☕', serviceType: 'قهوة', status: 'active' });

      window.location.reload();
    } catch (e: any) {
      setError(e.message || t('err_add_cafe_failed', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page" id="apPartners">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('partner_title', lang)}</div>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '.8rem' }} onClick={() => setShowModal(true)}>{t('add_cafe_btn', lang)}</button>
      </div>

      {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontSize: '.85rem' }}>{success}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>{t('name', lang)}</th><th>{t('email', lang)}</th><th>{t('th_service', lang)}</th><th>{t('status', lang)}</th><th>{t('th_join_date', lang)}</th></tr>
          </thead>
          <tbody>
            {(!cafes || cafes.length === 0) && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_cafes', lang)}</td></tr>
            )}
            {cafes.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.emoji} {c.name}</strong></td>
                <td>{c.email || '-'}</td>
                <td>{c.serviceType || '-'}</td>
                <td><span className={`table-badge badge-${c.status === 'active' ? 'green' : 'amber'}`}>{c.status}</span></td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>2024-01-{String(c.id).padStart(2, '0')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{t('add_cafe_modal_title', lang)}</div>
            {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
            <input className="coffee-input" placeholder={t('f_name_ar', lang)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_name_en', lang)} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_location', lang)} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_email', lang)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_emoji', lang)} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <select className="coffee-input" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
              <option value="قهوة">{t('service_coffee', lang)}</option>
              <option value="متخصصة">{t('service_specialty', lang)}</option>
              <option value="سعودية">{t('service_saudi', lang)}</option>
              <option value="مختصة">{t('service_artisan', lang)}</option>
            </select>
            <button className="action-btn" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleAdd}>
              {loading ? t('cafe_saving', lang) : t('cafe_add', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
