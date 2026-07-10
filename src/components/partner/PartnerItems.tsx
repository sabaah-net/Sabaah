'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, pushPendingMenuItem } from '../../lib/supabase';
import { t } from '../../i18n';
import { ref, update, db } from '../../lib/firebase';

interface MenuItemRow {
  id: string;
  name_ar: string;
  name_en: string | null;
  base_price: number;
  icon: string;
  description: string | null;
  status: string;
  points_per_item: number;
  cafe_id: string;
}

export default function PartnerItems() {
  const { lang, currentUser } = useAppStore();
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MenuItemRow | null>(null);
  const [form, setForm] = useState({ name: '', nameEn: '', desc: '', basePrice: 0, icon: '☕', pointsPerItem: 10 });
  const [newForm, setNewForm] = useState({ name: '', nameEn: '', desc: '', basePrice: 0, icon: '☕' });
  const [tab, setTab] = useState<'list' | 'add'>('list');
  const [savingPoints, setSavingPoints] = useState<string | null>(null);
  const [isCashier, setIsCashier] = useState(false);
  const [partnerRole, setPartnerRole] = useState('');

  useEffect(() => {
    const pid = currentUser?.profileId;
    if (!pid) return;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('partner_role').eq('id', pid).maybeSingle();
      if (profile?.partner_role) {
        setPartnerRole(profile.partner_role);
        setIsCashier(profile.partner_role === 'cashier');
      }
      const { data: cafe } = await supabase.from('cafes').select('id').eq('owner_id', pid).maybeSingle();
      if (cafe) {
        setCafeId(cafe.id);
        const { data } = await supabase.from('menu_items').select('*').eq('cafe_id', cafe.id).order('created_at', { ascending: false });
        if (data) setItems(data as MenuItemRow[]);
      }
    })();
  }, []);

  const toggleAvailability = async (item: MenuItemRow) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    await supabase.from('menu_items').update({ status: newStatus }).eq('id', item.id);
    setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    if (cafeId) {
      update(ref(db, `menu_items/${cafeId}/${item.id}`), { status: newStatus });
    }
  };

  const openEdit = (item: MenuItemRow) => {
    if (isCashier) return;
    setEditItem(item);
    setForm({
      name: item.name_ar,
      nameEn: item.name_en || '',
      desc: item.description || '',
      basePrice: item.base_price,
      icon: item.icon || '☕',
      pointsPerItem: item.points_per_item || 10,
    });
  };

  const handleEditSubmit = async () => {
    if (!editItem || !form.name) return;
    try {
      const { error } = await pushPendingMenuItem({
        cafe_id: cafeId || '',
        cafe_name: currentUser?.name || '',
        name_ar: form.name,
        name_en: form.nameEn || form.name,
        description: form.desc,
        base_price: form.basePrice,
        icon: form.icon,
        submitted_by: currentUser?.profileId || '',
        edit_type: 'update',
        original_item_id: editItem.id,
      } as any);
      if (error) throw error;
      setEditItem(null);
      alert(lang === 'ar' ? '✅ تم إرسال التعديل للمراجعة' : '✅ Edit sent for admin review');
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Error'));
    }
  };

  const handleNewSubmit = async () => {
    if (!newForm.name || !newForm.basePrice) return;
    try {
      const { error } = await pushPendingMenuItem({
        cafe_id: cafeId || '',
        cafe_name: currentUser?.name || '',
        name_ar: newForm.name,
        name_en: newForm.nameEn || newForm.name,
        description: newForm.desc,
        base_price: newForm.basePrice,
        icon: newForm.icon,
        submitted_by: currentUser?.profileId || '',
      });
      if (error) throw error;
      setNewForm({ name: '', nameEn: '', desc: '', basePrice: 0, icon: '☕' });
      setTab('list');
      alert(lang === 'ar' ? '✅ تم إرسال العنصر للمراجعة' : '✅ Item sent for admin review');
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Error'));
    }
  };

  const handlePointsChange = async (itemId: string, points: number) => {
    setSavingPoints(itemId);
    await supabase.from('menu_items').update({ points_per_item: points }).eq('id', itemId);
    setItems(items.map(i => i.id === itemId ? { ...i, points_per_item: points } : i));
    setSavingPoints(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`btn-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          {lang === 'ar' ? '📋 عناصر القائمة' : '📋 Menu Items'}
        </button>
        {!isCashier && (
          <button className={`btn-tab ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
            {lang === 'ar' ? '➕ عنصر جديد' : '➕ New Item'}
          </button>
        )}
      </div>

      {tab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30 }}>{lang === 'ar' ? 'لا توجد عناصر' : 'No items yet'}</div>
          )}
          {items.map(item => (
            <div key={item.id} style={{
              background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 12px',
              boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', gap: 10,
              opacity: item.status === 'active' ? 1 : 0.5,
            }}>
              <span style={{ fontSize: '1.3rem' }}>{item.icon || '☕'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{item.name_ar}</div>
                <div style={{ fontSize: '.72rem' }}>{item.name_en} — <span className="currency-sym">⃁</span>{item.base_price}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: '.65rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>⭐ {lang === 'ar' ? 'نقاط' : 'Points'}:</span>
                  <input
                    type="number" min="0" max="100"
                    value={item.points_per_item || 10}
                    onChange={(e) => handlePointsChange(item.id, Number(e.target.value))}
                    disabled={savingPoints === item.id}
                    style={{ width: 42, padding: '3px 6px', borderRadius: 6, border: '1.5px solid var(--latte)', textAlign: 'center', fontSize: '.78rem', fontWeight: 700, background: 'var(--cream)' }}
                  />
                </div>
              </div>
              <button className={`table-badge badge-${item.status === 'active' ? 'green' : 'amber'}`}
                style={{ fontSize: '.65rem', cursor: 'pointer', border: 'none' }}
                onClick={() => toggleAvailability(item)}>
                {item.status === 'active' ? (lang === 'ar' ? '✅ نشط' : 'Active') : (lang === 'ar' ? '⛔ غير نشط' : 'Inactive')}
              </button>
              {!isCashier && (
                <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.72rem', margin: 0 }} onClick={() => openEdit(item)}>
                  ✏️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="coffee-input" placeholder={lang === 'ar' ? 'اسم العنصر (عربي) *' : 'Item name (Arabic) *'} value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'اسم العنصر (إنجليزي)' : 'Item name (English)'} value={newForm.nameEn} onChange={(e) => setNewForm({ ...newForm, nameEn: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'الوصف' : 'Description'} value={newForm.desc} onChange={(e) => setNewForm({ ...newForm, desc: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'السعر *' : 'Price *'} type="number" step="0.01" value={newForm.basePrice || ''} onChange={(e) => setNewForm({ ...newForm, basePrice: parseFloat(e.target.value) || 0 })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'رمز (مثال: ☕)' : 'Icon'} value={newForm.icon} onChange={(e) => setNewForm({ ...newForm, icon: e.target.value })} />
          <button className="action-btn" style={{ width: '100%' }} onClick={handleNewSubmit}>
            {lang === 'ar' ? '📨 إرسال للمراجعة' : '📨 Submit for Review'}
          </button>
        </div>
      )}

      {editItem && (
        <div className="modal-overlay open" onClick={() => setEditItem(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">✏️ {lang === 'ar' ? 'تعديل العنصر' : 'Edit Item'}</div>
            <input className="coffee-input" placeholder={lang === 'ar' ? 'اسم (عربي) *' : 'Name (Arabic) *'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'اسم (إنجليزي)' : 'Name (English)'} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الوصف' : 'Description'} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            <input className="coffee-input" type="number" step="0.01" placeholder={lang === 'ar' ? 'السعر *' : 'Price *'} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الرمز' : 'Icon'} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <div style={{ fontSize: '.75rem', marginBottom: 8 }}>
              {lang === 'ar' ? '⏳ سيتم إرسال التعديلات للأدمن للمراجعة.' : '⏳ Edits will be sent to admin for review.'}
            </div>
            <button className="action-btn" style={{ width: '100%' }} onClick={handleEditSubmit}>
              {lang === 'ar' ? '📨 إرسال التعديل للمراجعة' : '📨 Submit Edit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
