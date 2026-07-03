'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { createMenuItem, addAuditLog } from '../../lib/supabase';
import { t } from '../../i18n';

export default function AdminMenus() {
  const { cafes, menuItems, lang } = useAppStore();
  const [selectedCafe, setSelectedCafe] = useState<number>(cafes[0]?.id || 1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '', basePrice: 7, status: 'active', cafeId: '' });

  const handleAdd = async () => {
    if (!form.name) { setError(t('err_item_name_required', lang)); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: err } = await createMenuItem({
        cafe_id: form.cafeId || undefined,
        name_ar: form.name,
        name_en: form.nameEn || form.name,
        description: form.desc || null,
        base_price: form.basePrice,
        vat_rate: 15,
        status: form.status,
        is_featured: false,
        sales_count: 0,
      });
      if (err) throw err;
      if (!data) throw new Error('لم يتم إنشاء العنصر');

      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `إضافة عنصر قائمة: ${form.name}`,
        action_type: 'create',
        details: `تمت إضافة ${form.name} إلى القائمة`,
      }).catch(() => {});

      setSuccess(t('item_added_success', lang).replace('{name}', form.name));
      setShowModal(false);
      setForm({ name: '', nameEn: '', desc: '', basePrice: 7, status: 'active', cafeId: '' });

      window.location.reload();
    } catch (e: any) {
      setError(e.message || t('err_add_item_failed', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page" id="apMenus">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('menu_title', lang)}</div>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '.8rem' }} onClick={() => setShowModal(true)}>{t('add_item_btn', lang)}</button>
      </div>

      {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontSize: '.85rem' }}>{success}</div>}

      <div className="admin-table-wrap" style={{ marginTop: 12 }}>
        <table className="admin-table">
          <thead>
            <tr><th>{t('th_image', lang)}</th><th>{t('name', lang)}</th><th>{t('th_description', lang)}</th><th>{t('th_price', lang)}</th><th>{t('th_category', lang)}</th><th>{t('th_status', lang)}</th></tr>
          </thead>
          <tbody>
            {(!menuItems || menuItems.length === 0) && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_items', lang)}</td></tr>
            )}
            {menuItems.map((item, idx) => (
              <tr key={idx}>
                <td><div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--latte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☕</div></td>
                <td><strong>{item.name}</strong></td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc || '-'}</td>
                <td>{item.base.toFixed(2)} ⃁</td>
                <td>{item.cat}</td>
                <td><span className={`table-badge badge-${item.status === 'active' ? 'green' : 'amber'}`}>{item.status === 'active' ? t('available', lang) : t('unavailable', lang)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{t('add_item_modal_title', lang)}</div>
            {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
            <select className="coffee-input" value={form.cafeId} onChange={(e) => setForm({ ...form, cafeId: e.target.value })}>
              <option value="">{t('all_cafes', lang)}</option>
              {cafes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <input className="coffee-input" placeholder={t('f_item_name_ar', lang)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_item_name_en', lang)} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            <input className="coffee-input" placeholder={t('f_item_desc', lang)} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            <input className="coffee-input" type="number" step="0.5" placeholder={t('f_item_base_price', lang)} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
            <select className="coffee-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('available', lang)}</option>
              <option value="inactive">{t('unavailable', lang)}</option>
            </select>
            <button className="action-btn" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleAdd}>
              {loading ? t('item_saving', lang) : t('item_add', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
