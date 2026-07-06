'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { getPromotionsForCafe, createPromotion, togglePromotion, deletePromotion } from '../../lib/pickme';
import type { PromotionRow } from '../../lib/pickme';

const PLACEHOLDER_PROMOS = [
  { id: 'pp1', name_ar: 'عرض الصباح', discount_percent: 20, start_time: '07:00', end_time: '10:00', is_active: true, cafe_id: '' },
  { id: 'pp2', name_ar: 'عرض الغداء', discount_percent: 15, start_time: '12:00', end_time: '14:00', is_active: true, cafe_id: '' },
  { id: 'pp3', name_ar: 'عرض المساء', discount_percent: 10, start_time: '18:00', end_time: '21:00', is_active: false, cafe_id: '' },
];

export default function PartnerPromos({ cafeId }: { cafeId: string | null }) {
  const store = useAppStore();
  const lang = store.lang;
  const [promos, setPromos] = useState<PromotionRow[]>([]);
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cafeId) return;
    setLoading(true);
    getPromotionsForCafe(cafeId).then(({ data }) => {
      if (data) setPromos(data as PromotionRow[]);
      setLoading(false);
    });
  }, [cafeId]);

  const handleCreate = async () => {
    if (!cafeId || !name || !discount) return;
    setSaving(true);
    const { data } = await createPromotion(cafeId, {
      name_ar: name,
      discount_percent: parseInt(discount),
      start_time: start,
      end_time: end,
    });
    if (data) setPromos(prev => [data as PromotionRow, ...prev]);
    setName('');
    setDiscount('');
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await togglePromotion(id, !current);
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  const handleDelete = async (id: string) => {
    await deletePromotion(id);
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  if (!cafeId) return (
    <div>
      <p className="section-title">{t('partner_promo_title', lang)}</p>
      <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>
        {lang === 'ar' ? 'لم يتم تعيين مقهى — عرض بيانات تجريبية' : 'No cafe assigned — showing demo data'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLACEHOLDER_PROMOS.map((p) => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--sh-sm)', borderRight: `3px solid ${p.is_active ? 'var(--green)' : 'var(--text-light)'}`, opacity: .7,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.name_ar}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{t('partner_promo_discount', lang)} {p.discount_percent}% • {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <p className="section-title">{t('partner_promo_title', lang)}</p>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        <input className="form-input" placeholder={t('partner_promo_name_placeholder', lang)} value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <input className="form-input" placeholder={t('partner_promo_discount_placeholder', lang)} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <input className="form-input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="form-input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="action-btn" disabled={saving} onClick={handleCreate}>
          {saving ? '...' : t('partner_promo_create', lang)}
        </button>
      </div>

      <p className="section-title" style={{ marginTop: 16 }}>{t('partner_promo_active', lang)}</p>
      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {promos.map((p) => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--sh-sm)', borderRight: `3px solid ${p.is_active ? 'var(--green)' : 'var(--text-light)'}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.name_ar}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{t('partner_promo_discount', lang)} {p.discount_percent}% • {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: p.is_active ? 'var(--green-bg)' : 'var(--latte)',
                color: p.is_active ? 'var(--green)' : 'var(--text-light)',
                cursor: 'pointer',
              }} onClick={() => handleToggle(p.id, p.is_active)}>
                {p.is_active ? t('partner_promo_active_label', lang) : t('partner_promo_inactive', lang)}
              </span>
              <button className="emp-delete-btn" onClick={() => handleDelete(p.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {!loading && promos.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLACEHOLDER_PROMOS.map((p) => (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: 'var(--sh-sm)', borderRight: `3px solid ${p.is_active ? 'var(--green)' : 'var(--text-light)'}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.name_ar}</div>
                  <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{t('partner_promo_discount', lang)} {p.discount_percent}% • {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: p.is_active ? 'var(--green-bg)' : 'var(--latte)',
                    color: p.is_active ? 'var(--green)' : 'var(--text-light)',
                  }}>
                    {p.is_active ? t('partner_promo_active_label', lang) : t('partner_promo_inactive', lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
