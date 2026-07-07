'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, createMenuItem, updateMenuItem, addAuditLog } from '../../lib/supabase';
import { t } from '../../i18n';
import type { Addon } from '../../types';

interface MenuRow {
  id: string;
  name_ar: string;
  name_en: string | null;
  cafe_id: string;
  cafes?: { name_ar: string; name_en: string } | null;
  base_price: number;
  vat_rate: number;
  status: string;
  description: string | null;
  sales_count: number;
  icon: string;
  points_per_item: number;
}

type SubTab = 'items' | 'addons';

export default function AdminMenus() {
  const { lang, addons } = useAppStore();
  const [subTab, setSubTab] = useState<SubTab>('items');
  const [items, setItems] = useState<MenuRow[]>([]);
  const [cafes, setCafes] = useState<{ id: string; name_ar: string; name_en: string }[]>([]);
  const [filterCafe, setFilterCafe] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name_ar: '', name_en: '', description: '', base_price: 7, status: 'active', cafe_id: '', points_per_item: 10 });
  const [addonList, setAddonList] = useState<Addon[]>(addons);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);

  const fetchAll = async () => {
    const [itemsRes, cafesRes] = await Promise.all([
      supabase.from('menu_items').select('*, cafes(name_ar, name_en)').order('created_at', { ascending: false }),
      supabase.from('cafes').select('id, name_ar, name_en').eq('status', 'active'),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as MenuRow[]);
    if (cafesRes.data) setCafes(cafesRes.data as any);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filterCafe ? items.filter(i => i.cafe_id === filterCafe) : items;

  const openAdd = () => {
    setEditId(null);
    setForm({ name_ar: '', name_en: '', description: '', base_price: 7, status: 'active', cafe_id: '', points_per_item: 10 });
    setModalMode('add'); setError(''); setSuccess('');
  };

  const openEdit = (item: MenuRow) => {
    setEditId(item.id);
    setForm({ name_ar: item.name_ar, name_en: item.name_en || '', description: item.description || '', base_price: item.base_price, status: item.status, cafe_id: item.cafe_id, points_per_item: item.points_per_item || 10 });
    setModalMode('edit'); setError(''); setSuccess('');
  };

  const handleSave = async () => {
    if (!form.name_ar) { setError(t('err_item_name_required', lang)); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (modalMode === 'add') {
        const { error: err } = await createMenuItem({
          cafe_id: form.cafe_id || undefined,
          name_ar: form.name_ar,
          name_en: form.name_en || form.name_ar,
          description: form.description || null,
          base_price: form.base_price,
          points_per_item: form.points_per_item,
          vat_rate: 15,
          status: form.status,
          is_featured: false,
          sales_count: 0,
        });
        if (err) throw err;
        setSuccess(t('item_added_success', lang).replace('{name}', form.name_ar));
      } else if (editId) {
        const { error: err } = await updateMenuItem(editId, {
          name_ar: form.name_ar,
          name_en: form.name_en || form.name_ar,
          description: form.description || null,
          base_price: form.base_price,
          status: form.status,
          points_per_item: form.points_per_item,
        });
        if (err) throw err;
        setSuccess(`✅ ${form.name_ar} updated`);
      }

      addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: `${modalMode === 'add' ? 'Add' : 'Edit'} menu item: ${form.name_ar}`,
        action_type: 'create',
        details: `${modalMode === 'add' ? 'Added' : 'Edited'} menu item ${form.name_ar}`,
      }).catch(() => {});

      setModalMode(null);
      fetchAll();
    } catch (e: any) {
      setError(e.message || t('err_add_item_failed', lang));
    } finally { setLoading(false); }
  };

  const toggleStatus = async (item: MenuRow) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    const { error: err } = await updateMenuItem(item.id, { status: newStatus });
    if (!err) fetchAll();
  };

  return (
    <div className="admin-page" id="apMenus">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('menu_title', lang)}</div>
        {subTab === 'items' && (
          <button className="action-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '.8rem' }} onClick={openAdd}>{t('add_item_btn', lang)}</button>
        )}
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
        {(['items', 'addons'] as SubTab[]).map((st) => (
          <button key={st} className={`btn-tab ${subTab === st ? 'active' : ''}`} onClick={() => setSubTab(st)}>
            {st === 'items' ? '☕' : '🧃'} {st === 'items' ? t('menu_title', lang) : (lang === 'ar' ? 'الإضافات' : 'Add-ons')}
          </button>
        ))}
      </div>

      {success && <div style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontSize: '.85rem' }}>{success}</div>}

      {subTab === 'items' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <select className="coffee-input" style={{ width: 220 }} value={filterCafe} onChange={(e) => setFilterCafe(e.target.value)}>
              <option value="">{t('all_cafes', lang)}</option>
              {cafes.map(c => <option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>)}
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>{t('th_image', lang)}</th><th>{t('name', lang)}</th><th>English</th><th>{t('th_price', lang)}</th><th>⭐</th><th>{t('th_cafe', lang)}</th><th>{t('th_status', lang)}</th><th>{t('th_actions', lang)}</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_items', lang)}</td></tr>
                )}
                {filtered.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td><div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--latte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon || '☕'}</div></td>
                    <td><strong>{item.name_ar}</strong></td>
                    <td style={{ color: 'var(--text-light)' }}>{item.name_en || '-'}</td>
                    <td><span className="currency-sym">⃁</span>{(item.base_price).toFixed(2)}</td>
                    <td style={{ fontSize: '.78rem', fontWeight: 700 }}>⭐ {item.points_per_item ?? 10}</td>
                    <td style={{ fontSize: '.78rem' }}>{item.cafes?.name_ar || '-'}</td>
                    <td>
                      <span className={`table-badge badge-${item.status === 'active' ? 'green' : 'amber'}`}
                        style={{ cursor: 'pointer' }} onClick={() => toggleStatus(item)}>
                        {item.status === 'active' ? t('available', lang) : t('unavailable', lang)}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.72rem', margin: 0 }}
                        onClick={() => openEdit(item)}>
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
                <div className="modal-title">{modalMode === 'add' ? t('add_item_modal_title', lang) : `✏️ ${t('edit', lang)} ${form.name_ar}`}</div>
                {error && <div style={{ background: 'var(--red)', color: '#fff', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '.8rem' }}>{error}</div>}
                <select className="coffee-input" value={form.cafe_id} onChange={(e) => setForm({ ...form, cafe_id: e.target.value })}>
                  <option value="">{t('all_cafes', lang)}</option>
                  {cafes.map(c => <option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>)}
                </select>
                <input className="coffee-input" placeholder={t('f_item_name_ar', lang)} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                <input className="coffee-input" placeholder={t('f_item_name_en', lang)} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
                <input className="coffee-input" placeholder={t('f_item_desc', lang)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input className="coffee-input" type="number" step="0.5" placeholder={t('f_item_base_price', lang)} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} />
                <select className="coffee-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">{t('available', lang)}</option>
                  <option value="inactive">{t('unavailable', lang)}</option>
                </select>
                <input className="coffee-input" type="number" min="0" max="100" placeholder="⭐ Points per item" value={form.points_per_item} onChange={(e) => setForm({ ...form, points_per_item: Number(e.target.value) })} />
                <button className="action-btn" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSave}>
                  {loading ? t('item_saving', lang) : modalMode === 'add' ? t('item_add', lang) : `💾 ${t('save_btn', lang)}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'addons' && (
        <div className="admin-table-wrap" style={{ maxWidth: 600 }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 800, marginBottom: 8 }}>🧃 {lang === 'ar' ? 'إدارة الإضافات' : 'Add-ons Management'}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-light)', marginBottom: 14 }}>
              {lang === 'ar' ? 'تعديل اسم وسعر وأيقونة كل إضافة' : 'Edit name, price & icon for each add-on'}
            </div>
            {addonList.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{a.icon}</span>
                {editingAddonId === a.id ? (
                  <>
                    <input className="coffee-input" style={{ flex: 2, margin: 0 }} value={a.name} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], name: e.target.value }; setAddonList(list);
                    }} placeholder={lang === 'ar' ? 'الاسم (عربي)' : 'Name (Ar)'} />
                    <input className="coffee-input" style={{ flex: 2, margin: 0 }} value={a.nameEn} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], nameEn: e.target.value }; setAddonList(list);
                    }} placeholder={lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (En)'} />
                    <input className="coffee-input" style={{ width: 60, margin: 0 }} type="number" value={a.price} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], price: Math.max(0, parseFloat(e.target.value) || 0) }; setAddonList(list);
                    }} />
                    <input className="coffee-input" style={{ width: 50, margin: 0 }} value={a.icon} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], icon: e.target.value }; setAddonList(list);
                    }} />
                    <button className="action-btn secondary" style={{ width: 'auto', padding: '6px 10px', fontSize: '.7rem', margin: 0 }}
                      onClick={() => {
                        const s = useAppStore.getState();
                        (s as any).setAddons?.(addonList);
                        setEditingAddonId(null);
                      }}>
                      💾
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 2, fontWeight: 700, fontSize: '.85rem' }}>{a.name}</span>
                    <span style={{ flex: 2, fontSize: '.8rem' }}>{a.nameEn}</span>
                    <span style={{ width: 60, fontWeight: 600 }}>{a.price}<span className="currency-sym">⃁</span></span>
                    <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 8px', fontSize: '.7rem', margin: 0 }}
                      onClick={() => setEditingAddonId(a.id)}>
                      ✏️
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
