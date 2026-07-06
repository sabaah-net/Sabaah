'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getAllSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '../../lib/supabase';
import { useToast } from '../shared/Toast';

interface Plan {
  id: string; name_ar: string; name_en: string; description_ar: string; description_en: string;
  price_weekly: number; features: string[]; is_active: boolean;
  discount_percent: number; free_delivery: boolean;
  days_of_week?: string[]; max_bookings?: number;
}

const WEEK_DAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEK_DAYS_LABELS: Record<string, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
};

export default function AdminSubscriptions() {
  const { lang } = useAppStore();
  const { show } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '',
    price_weekly: 49, features: '', discount_percent: 0, free_delivery: false,
    days: WEEK_DAYS_EN.slice(0, 5), max_bookings: 30,
  });

  const fetch = async () => {
    setLoading(true);
    const { data } = await getAllSubscriptionPlans();
    if (data) setPlans(data as Plan[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', price_weekly: 49, features: '', discount_percent: 0, free_delivery: false, days: WEEK_DAYS_EN.slice(0, 5), max_bookings: 30 });
    setModal('create');
  };

  const openEdit = (p: Plan) => {
    setEditId(p.id);
    setForm({
      name_ar: p.name_ar, name_en: p.name_en || '',
      description_ar: p.description_ar || '', description_en: p.description_en || '',
      price_weekly: p.price_weekly,
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      discount_percent: p.discount_percent || 0,
      free_delivery: p.free_delivery || false,
      days: Array.isArray(p.days_of_week) ? p.days_of_week : WEEK_DAYS_EN.slice(0, 5),
      max_bookings: p.max_bookings || 30,
    });
    setModal('edit');
  };

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name_ar) { show('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const features = form.features.split('\n').map(s => s.trim()).filter(Boolean);
      const planData = {
        name_ar: form.name_ar, name_en: form.name_en,
        description_ar: form.description_ar, description_en: form.description_en,
        price_weekly: form.price_weekly, features,
        discount_percent: form.discount_percent, free_delivery: form.free_delivery,
        days_of_week: form.days, max_bookings: form.max_bookings,
      };
      if (modal === 'create') {
        await createSubscriptionPlan(planData);
        show('Plan created', 'success');
      } else if (editId) {
        await updateSubscriptionPlan(editId, planData);
        show('Plan updated', 'success');
      }
      setModal(null);
      fetch();
    } catch (e: any) {
      show(e.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const handleToggle = async (p: Plan) => {
    await updateSubscriptionPlan(p.id, { is_active: !p.is_active });
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await deleteSubscriptionPlan(id);
    show('Plan deleted', 'success');
    fetch();
  };

  return (
    <div className="admin-page" id="apSubscriptions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>📅 {lang === 'ar' ? 'إدارة الاشتراكات' : 'Subscription Plans'}</div>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 14px', fontSize: '.8rem' }} onClick={openCreate}>➕ {lang === 'ar' ? 'إضافة خطة' : 'Add Plan'}</button>
      </div>

      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>}

      {!loading && plans.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>{lang === 'ar' ? 'لا توجد خطط اشتراك' : 'No subscription plans'}</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {plans.map((p) => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 'var(--r-md)', padding: 16, boxShadow: 'var(--sh-sm)',
            border: p.is_active ? '1px solid var(--latte)' : '2px dashed var(--red)',
            opacity: p.is_active ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{lang === 'ar' ? p.name_ar : (p.name_en || p.name_ar)}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginTop: 2 }}>{(lang === 'ar' ? p.description_ar : p.description_en) || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--bark)' }}>⃁ {p.price_weekly.toFixed(2)}<span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--text-light)' }}>/{lang === 'ar' ? 'شهر' : 'mo'}</span></div>
                {p.discount_percent > 0 && <div style={{ fontSize: '.75rem', color: 'var(--green)', fontWeight: 700 }}>-{p.discount_percent}% {lang === 'ar' ? 'خصم' : 'discount'}</div>}
                {p.free_delivery && <div style={{ fontSize: '.7rem', color: 'var(--amber)', fontWeight: 600 }}>🚚 {lang === 'ar' ? 'توصيل مجاني' : 'Free delivery'}</div>}
              </div>
            </div>
            {Array.isArray(p.days_of_week) && p.days_of_week.length > 0 && (
              <div style={{ fontSize: '.72rem', color: 'var(--text-mid)', marginBottom: 6 }}>
                {p.days_of_week.map(d => (
                  <span key={d} style={{ display: 'inline-block', background: 'var(--cream)', borderRadius: 6, padding: '2px 6px', margin: '2px 3px 2px 0', fontSize: '.68rem' }}>{WEEK_DAYS_LABELS[d] || d}</span>
                ))}
              </div>
            )}
            {Array.isArray(p.features) && p.features.length > 0 && (
              <div style={{ fontSize: '.8rem', color: 'var(--text-mid)', marginBottom: 10 }}>
                {p.features.slice(0, 5).map((f, i) => (
                  <span key={i} style={{ display: 'inline-block', background: 'var(--latte)', borderRadius: 6, padding: '2px 8px', margin: '2px 4px 2px 0', fontSize: '.72rem' }}>{f}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="action-btn secondary" style={{ width: 'auto', padding: '5px 12px', fontSize: '.72rem' }} onClick={() => openEdit(p)}>✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}</button>
              <button className="action-btn secondary" style={{ width: 'auto', padding: '5px 12px', fontSize: '.72rem' }} onClick={() => handleToggle(p)}>{p.is_active ? '🚫' : '✅'} {p.is_active ? (lang === 'ar' ? 'تعطيل' : 'Disable') : (lang === 'ar' ? 'تفعيل' : 'Enable')}</button>
              <button className="action-btn secondary" style={{ width: 'auto', padding: '5px 12px', fontSize: '.72rem', background: 'var(--red)', color: '#fff' }} onClick={() => handleDelete(p.id)}>🗑️ {lang === 'ar' ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{modal === 'create' ? '➕ ' + (lang === 'ar' ? 'خطة جديدة' : 'New Plan') : '✏️ ' + (lang === 'ar' ? 'تعديل الخطة' : 'Edit Plan')}</div>
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            <input className="coffee-input" placeholder={lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
            <input className="coffee-input" type="number" step="0.01" placeholder={lang === 'ar' ? 'السعر شهرياً' : 'Price (weekly)'} value={form.price_weekly} onChange={(e) => setForm({ ...form, price_weekly: Number(e.target.value) })} />
            <input className="coffee-input" type="number" min="0" max="100" step="1" placeholder={lang === 'ar' ? 'نسبة الخصم %' : 'Discount %'} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            <input className="coffee-input" type="number" min="1" placeholder={lang === 'ar' ? 'الحد الأقصى للحجوزات' : 'Max bookings'} value={form.max_bookings} onChange={(e) => setForm({ ...form, max_bookings: Number(e.target.value) })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', padding: '6px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.free_delivery} onChange={(e) => setForm({ ...form, free_delivery: e.target.checked })} />
              🚚 {lang === 'ar' ? 'توصيل مجاني' : 'Free delivery'}
            </label>
            <div style={{ fontSize: '.78rem', color: 'var(--text-light)', margin: '6px 0 4px' }}>{lang === 'ar' ? 'أيام التوصيل:' : 'Delivery days:'}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {WEEK_DAYS_EN.map(day => {
                const isSel = form.days.includes(day);
                return (
                  <button key={day} className="action-btn secondary"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '.68rem', background: isSel ? 'var(--amber)' : '', color: isSel ? '#fff' : '' }}
                    onClick={() => toggleDay(day)}>
                    {WEEK_DAYS_LABELS[day]}
                  </button>
                );
              })}
            </div>
            <textarea className="coffee-input" style={{ minHeight: 80, resize: 'vertical' }} placeholder={lang === 'ar' ? 'المميزات (واحد في كل سطر)' : 'Features (one per line)'} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            <button className="action-btn" style={{ width: '100%', marginTop: 8, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSave}>
              {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : `💾 ${lang === 'ar' ? 'حفظ' : 'Save'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
