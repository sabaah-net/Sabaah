'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useToast } from '../shared/Toast';
import PriceTag from '../shared/PriceTag';
import type { Addon } from '../../types';
import { getUserSubscription } from '../../lib/supabase';

function generateAllSlots(avgWaitMin: number = 5): Date[] {
  const now = new Date();
  let firstOffset = Math.max(15, avgWaitMin);
  firstOffset = Math.ceil(firstOffset / 15) * 15;
  const slots: Date[] = [];
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 45, 0, 0);
  for (let offset = firstOffset; ; offset += 15) {
    const slot = new Date(now.getTime() + offset * 60 * 1000);
    if (slot > endOfDay) break;
    slots.push(slot);
  }
  return slots;
}

const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠','1': '١','2': '٢','3': '٣','4': '٤',
  '5': '٥','6': '٦','7': '٧','8': '٨','9': '٩',
};
function toArabicNumeral(s: string): string {
  return s.replace(/[0-9]/g, (c) => ARABIC_NUMERALS[c] || c);
}

function formatTime(d: Date | undefined, lang?: string): string {
  if (!d) return '—';
  try {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h24 = h.toString().padStart(2, '0');
    const timeStr = `${h24}:${m} ${ampm}`;
    return lang === 'ar' ? toArabicNumeral(timeStr) : timeStr;
  } catch {
    return '—';
  }
}

const POINTS_PER_DRINK = 10;

export default function PayModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [method, setMethod] = useState<'wallet' | 'stcpay' | 'credit'>('wallet');
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const cafeWaitMin = store.selectedCafe?.avg_wait_min || 5;
  const slots = useMemo(() => generateAllSlots(cafeWaitMin), [cafeWaitMin]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [subDiscount, setSubDiscount] = useState(0);

  const rawTotal = store.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const subtotalWithAddons = rawTotal + addonTotal;
  const discountAmount = subtotalWithAddons * (subDiscount / 100);
  const total = subtotalWithAddons - discountAmount;

  useEffect(() => {
    if (store.currentUser?.profileId) {
      getUserSubscription(store.currentUser.profileId).then(({ data }) => {
        if (data && (data as any).status === 'active') {
          setSubDiscount((data as any).subscription_plans?.discount_percent || 0);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (wheelRef.current && slots.length > 0) {
      const el = wheelRef.current;
      const itemHeight = 44;
      el.scrollTop = selectedSlotIndex * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!wheelRef.current) return;
    const el = wheelRef.current;
    const itemHeight = 44;
    const idx = Math.round(el.scrollTop / itemHeight);
    if (idx >= 0 && idx < slots.length) {
      setSelectedSlotIndex(idx);
    }
  };

  const handlePay = async () => {
    if (slots.length === 0) {
      show(store.lang === 'ar' ? 'لا توجد أوقات متاحة اليوم' : 'No available times today', 'error');
      return;
    }
    if (isNaN(total) || total <= 0) {
      show(t('payment_error', store.lang) || 'Invalid total', 'error');
      return;
    }
    if (method === 'wallet' && store.wallet < total) {
      show(t('insufficient_balance', store.lang), 'error');
      return;
    }
    store.setSelectedPickupSlot(formatTime(slots[selectedSlotIndex], store.lang));
    await store.processPayment(method, selectedAddons);
    show(t('payment_successful', store.lang), 'success');
    closeModal();
  };

  const closeModal = () => document.getElementById('payModal')?.classList.remove('open');

  const methodLabels: Record<string, { icon: string; key: string }> = {
    wallet: { icon: '💰', key: 'wallet_method' },
    stcpay: { icon: '📱', key: 'stcpay_method' },
    credit: { icon: '💳', key: 'credit_method' },
  };

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  return (
    <div className="modal-overlay" id="payModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', left: 18, top: 22, fontSize: '1.3rem', fontWeight: 700 }}>✕</button>
        <div className="modal-title" style={{ fontSize: '1.25rem' }}>{t('pay_modal_title', store.lang)}</div>

        {/* Cafe info */}
        {store.selectedCafe && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: '6px 10px', marginBottom: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>{store.selectedCafe.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{store.lang === 'ar' ? store.selectedCafe.name : store.selectedCafe.nameEn}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{store.selectedCafe.sub}</div>
            </div>
          </div>
        )}

        {/* Cart items */}
        <div style={{ background: '#fff', borderRadius: 'var(--r-sm)', padding: '6px 10px', marginBottom: 8, boxShadow: 'var(--sh-sm)' }}>
          {store.cart.map((item, i) => (
            <div key={i} className="cart-item" style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.name}</div>
                  <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{item.qty} × <PriceTag value={item.price} /></div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--bark)' }}><PriceTag value={item.price * item.qty} /></div>
            </div>
          ))}
          {subDiscount > 0 && (
            <div className="cart-total-row" style={{ fontSize: '.88rem', padding: '3px 0', color: 'var(--green)' }}>
              <span>💎 {t('sub_discount', store.lang) || 'Sub discount'} (-{subDiscount}%)</span>
              <span>-<PriceTag value={discountAmount} /></span>
            </div>
          )}
          <div className="cart-total-row" style={{ fontSize: '1.15rem', fontWeight: 900, padding: '5px 0 0', borderTop: '1px solid var(--latte)' }}>
            <span>
              {t('cart_total', store.lang)}{' '}
              <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--amber)' }}>
                [⭐ {store.lang === 'ar' ? 'ستحصل على' : "You'll earn"}{' '}
                {store.cart.reduce((s, i) => s + i.qty, 0) * POINTS_PER_DRINK}{' '}
                {t('loyalty_points_label', store.lang)}]
              </span>
            </span>
            <span><PriceTag value={total} /></span>
          </div>
        </div>

        {/* iOS-style time wheel */}
        <div className="time-wheel-container" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '.9rem', fontWeight: 700, padding: '0 14px 4px', textAlign: 'center' }}>
            ⏱️ {t('pickup_time', store.lang) || 'Pickup Time'}
          </div>
          {slots.length === 0 && (
            <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-light)', fontSize: '.85rem' }}>
              {store.lang === 'ar' ? 'لا توجد أوقات متاحة اليوم' : 'No available times today'}
            </div>
          )}
          {slots.length > 0 && (
            <>
              <div className="time-wheel-highlight" />
              <div className="time-wheel-mask" ref={wheelRef} onScroll={handleScroll}>
                <div style={{ height: 44 }} />
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className={`time-wheel-item ${selectedSlotIndex === i ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSlotIndex(i);
                      if (wheelRef.current) {
                        wheelRef.current.scrollTop = i * 44;
                      }
                    }}
                  >
                    <span style={{ fontSize: '.9rem' }}>{formatTime(slot, store.lang)}</span>
                  </div>
                ))}
                <div style={{ height: 44 }} />
              </div>
            </>
          )}
        </div>

        {/* Add-ons horizontal box */}
        {store.addons.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 'var(--r-sm)', padding: '6px 10px', marginBottom: 8, boxShadow: 'var(--sh-sm)' }}>
            <div style={{ fontSize: '.9rem', fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
              🧃 {store.lang === 'ar' ? 'إضافات' : 'Add-ons'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {store.addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    className={`pay-method ${isSelected ? 'active' : ''}`}
                    style={{ padding: '6px 4px', fontSize: '.82rem', minWidth: 0, textAlign: 'center' }}
                    onClick={() => toggleAddon(addon)}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{addon.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', margin: '2px 0' }}>
                      {store.lang === 'ar' ? addon.name : addon.nameEn}
                    </div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--amber)' }}>
                      +<PriceTag value={addon.price} />
                    </div>
                  </button>
                );
              })}
            </div>
            {addonTotal > 0 && (
              <div style={{ fontSize: '.85rem', fontWeight: 700, textAlign: 'right', marginTop: 3, padding: '3px 0 0', borderTop: '1px solid var(--latte)' }}>
                {store.lang === 'ar' ? 'إجمالي الإضافات' : 'Add-ons total'}: +<PriceTag value={addonTotal} />
              </div>
            )}
          </div>
        )}

        {/* Payment method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
          {(['wallet', 'stcpay', 'credit'] as const).map((m) => (
            <button
              key={m}
              className={`pay-method ${method === m ? 'active' : ''}`}
              onClick={() => setMethod(m)}
              style={{ fontSize: '.82rem', padding: '6px 4px' }}
            >
              <span className="pay-icon" style={{ fontSize: '1.2rem' }}>{methodLabels[m].icon}</span>
              <span style={{ fontSize: '.82rem' }}>{t(methodLabels[m].key, store.lang)}</span>
            </button>
          ))}
        </div>

        {method === 'wallet' && (
          <div style={{
            fontSize: '.9rem', padding: '6px 10px', borderRadius: 'var(--r-sm)',
            background: store.wallet >= total ? 'var(--green-bg)' : 'var(--red-bg)',
            color: store.wallet >= total ? 'var(--green)' : 'var(--red)',
            textAlign: 'center', marginBottom: 8, fontWeight: 700,
          }}>
            {t('wallet_balance', store.lang)}: <PriceTag value={store.wallet} />
            {store.wallet < total && ` — ${t('insufficient_balance', store.lang)}`}
          </div>
        )}

        {method === 'credit' && (
          <div style={{
            fontSize: '.9rem', padding: '6px 10px', borderRadius: 'var(--r-sm)',
            background: 'var(--cream)', textAlign: 'center', marginBottom: 8, fontWeight: 600,
          }}>
            💳 {store.lang === 'ar' ? 'بطاقة ائتمان / خصم' : 'Credit / Debit Card'}
          </div>
        )}

        <button className="action-btn" style={{ width: '100%', padding: 12, fontSize: '1.05rem', fontWeight: 800 }} onClick={handlePay}>
          {t('confirm_payment', store.lang)} — <PriceTag value={total} />
        </button>
      </div>
    </div>
  );
}