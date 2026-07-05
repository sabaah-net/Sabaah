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

function formatTime(d: Date, lang?: string): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h24 = h.toString().padStart(2, '0');
  const timeStr = `${h24}:${m} ${ampm}`;
  return lang === 'ar' ? toArabicNumeral(timeStr) : timeStr;
}

const POINTS_PER_DRINK = 10;

export default function PayModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [method, setMethod] = useState<'wallet' | 'stcpay'>('wallet');
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
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', left: 18, top: 22, fontSize: '1.2rem' }}>✕</button>
        <div className="modal-title">{t('pay_modal_title', store.lang)}</div>

        {/* Cafe info */}
        {store.selectedCafe && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 14 }}>
            <span style={{ fontSize: '1.3rem' }}>{store.selectedCafe.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{store.lang === 'ar' ? store.selectedCafe.name : store.selectedCafe.nameEn}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{store.selectedCafe.sub}</div>
            </div>
          </div>
        )}

        {/* Cart items */}
        <div style={{ background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 12, boxShadow: 'var(--sh-sm)' }}>
          {store.cart.map((item, i) => (
            <div key={i} className="cart-item" style={{ padding: '7px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{item.name}</div>
                  <div style={{ fontSize: '.75rem', fontWeight: 600 }}>{item.qty} × <PriceTag value={item.price} /></div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--bark)' }}><PriceTag value={item.price * item.qty} /></div>
            </div>
          ))}
          {subDiscount > 0 && (
            <div className="cart-total-row" style={{ fontSize: '.82rem', padding: '4px 0', color: 'var(--green)' }}>
              <span>💎 {t('sub_discount', store.lang) || 'Sub discount'} (-{subDiscount}%)</span>
              <span>-<PriceTag value={discountAmount} /></span>
            </div>
          )}
          <div className="cart-total-row" style={{ fontSize: '1rem', fontWeight: 900, padding: '8px 0 0', borderTop: '1px solid var(--latte)' }}>
            <span>
              {t('cart_total', store.lang)}{' '}
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--amber)' }}>
                [⭐ {store.lang === 'ar' ? 'ستحصل على' : "You'll earn"}{' '}
                {store.cart.reduce((s, i) => s + i.qty, 0) * POINTS_PER_DRINK}{' '}
                {t('loyalty_points_label', store.lang)}]
              </span>
            </span>
            <span><PriceTag value={total} /></span>
          </div>
        </div>

        {/* iOS-style time wheel */}
        <div className="time-wheel-container">
          <div style={{ fontSize: '.82rem', fontWeight: 700, padding: '0 14px 6px', textAlign: 'center' }}>
            ⏱️ {t('pickup_time', store.lang) || 'Pickup Time'}
          </div>
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
                {formatTime(slot)}
              </div>
            ))}
            <div style={{ height: 44 }} />
          </div>
        </div>

        {/* Add-ons horizontal box */}
        {store.addons.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 12, boxShadow: 'var(--sh-sm)' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
              🧃 {store.lang === 'ar' ? 'إضافات' : 'Add-ons'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {store.addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    className={`pay-method ${isSelected ? 'active' : ''}`}
                    style={{ padding: '10px 6px', fontSize: '.8rem', minWidth: 0, textAlign: 'center' }}
                    onClick={() => toggleAddon(addon)}
                  >
                    <div style={{ fontSize: '1.3rem' }}>{addon.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '.78rem', margin: '2px 0' }}>
                      {store.lang === 'ar' ? addon.name : addon.nameEn}
                    </div>
                    <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--amber)' }}>
                      +<PriceTag value={addon.price} />
                    </div>
                  </button>
                );
              })}
            </div>
            {addonTotal > 0 && (
              <div style={{ fontSize: '.8rem', fontWeight: 700, textAlign: 'right', marginTop: 6, padding: '4px 0 0', borderTop: '1px solid var(--latte)' }}>
                {store.lang === 'ar' ? 'إجمالي الإضافات' : 'Add-ons total'}: +<PriceTag value={addonTotal} />
              </div>
            )}
          </div>
        )}

        {/* Payment method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {(['wallet', 'stcpay'] as const).map((m) => (
            <button
              key={m}
              className={`pay-method ${method === m ? 'active' : ''}`}
              onClick={() => setMethod(m)}
            >
              <span className="pay-icon">{methodLabels[m].icon}</span>
              {t(methodLabels[m].key, store.lang)}
            </button>
          ))}
        </div>

        {method === 'wallet' && (
          <div style={{
            fontSize: '.82rem', padding: '8px 12px', borderRadius: 'var(--r-sm)',
            background: store.wallet >= total ? 'var(--green-bg)' : 'var(--red-bg)',
            color: store.wallet >= total ? 'var(--green)' : 'var(--red)',
            textAlign: 'center', marginBottom: 12, fontWeight: 700,
          }}>
            {t('wallet_balance', store.lang)}: <PriceTag value={store.wallet} />
            {store.wallet < total && ` — ${t('insufficient_balance', store.lang)}`}
          </div>
        )}

        <button className="action-btn" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handlePay}>
          {t('confirm_payment', store.lang)} — <PriceTag value={total} />
        </button>
      </div>
    </div>
  );
}
