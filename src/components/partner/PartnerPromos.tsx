'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { getPromotionsForCafe, createPromotion, togglePromotion, deletePromotion } from '../../lib/pickme';
import { watchPromos, pushPromo, togglePromoActive, deletePromo } from '../../lib/firebase';
import type { PromotionRow } from '../../lib/pickme';
import { supabase } from '../../lib/supabase';

export default function PartnerPromos({ cafeId }: { cafeId: string | null }) {
  const store = useAppStore();
  const lang = store.lang;
  const [promos, setPromos] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const pid = store.currentUser?.profileId;
    if (!pid) return;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('partner_role').eq('id', pid).maybeSingle();
      setIsOwner(profile?.partner_role === 'owner');
    })();
  }, []);

  useEffect(() => {
    if (!cafeId) return;
    setLoading(true);
    getPromotionsForCafe(cafeId).then(({ data }) => {
      if (data) setPromos(data as PromotionRow[]);
      setLoading(false);
    });
    const cleanup = watchPromos(cafeId, (fbPromos) => {
      if (fbPromos.length > 0) {
        setPromos(prev => {
          const merged = [...fbPromos];
          prev.forEach(p => {
            if (!merged.find(m => m.id === p.id)) {
              const fbP = fbPromos.find(f => f.id === p.id);
              if (!fbP) merged.push(p);
            }
          });
          return merged;
        });
      }
    });
    return cleanup;
  }, [cafeId]);

  const handleCreate = async () => {
    if (!isOwner || !cafeId || !name || !discount) return;
    setSaving(true);
    const { data } = await createPromotion(cafeId, {
      name_ar: name,
      discount_percent: parseInt(discount),
      start_time: start,
      end_time: end,
    });
    if (data) {
      const row = data as PromotionRow;
      setPromos(prev => [row, ...prev]);
      pushPromo(cafeId, {
        name_ar: row.name_ar,
        discount_percent: row.discount_percent,
        start_time: row.start_time,
        end_time: row.end_time,
        is_active: true,
      });
    }
    setName('');
    setDiscount('');
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!isOwner || !cafeId) return;
    await togglePromotion(id, !current);
    togglePromoActive(cafeId, id, !current);
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  const handleDelete = async (id: string) => {
    if (!isOwner || !cafeId) return;
    await deletePromotion(id);
    deletePromo(cafeId, id);
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  if (!cafeId) return (
    <div>
      <p className="section-title">{t('partner_promo_title', lang)}</p>
      <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>
        {lang === 'ar' ? 'لم يتم تعيين مقهى' : 'No cafe assigned'}
      </p>
    </div>
  );

  return (
    <div>
      <p className="section-title">{t('partner_promo_title', lang)}</p>

      {isOwner && (
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
      )}

      {!isOwner && (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 10, fontSize: '.78rem' }}>
          {lang === 'ar' ? 'فقط المالك يمكنه إدارة العروض' : 'Only the owner can manage promos'}
        </p>
      )}

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
            {isOwner && (
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
            )}
            {!isOwner && (
              <span style={{
                fontSize: '.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: p.is_active ? 'var(--green-bg)' : 'var(--latte)',
                color: p.is_active ? 'var(--green)' : 'var(--text-light)',
              }}>
                {p.is_active ? t('partner_promo_active_label', lang) : t('partner_promo_inactive', lang)}
              </span>
            )}
          </div>
        ))}
        {promos.length === 0 && !loading && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 10 }}>{lang === 'ar' ? 'لا توجد عروض' : 'No promos'}</p>
        )}
      </div>
    </div>
  );
}
