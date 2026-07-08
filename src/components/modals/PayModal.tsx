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
    const h12 = h % 12 || 12;
    const ampm = h >= 12 ? 'pm' : 'am';
    const timeStr = `${h12}:${m}${ampm}`;
    if (lang === 'ar') {
      const arabicDigits = toArabicNumeral(`${h12}:${m}`);
      return `${arabicDigits}م`;
    }
    return timeStr;
  } catch {
    return '—';
  }
}

const POINTS_PER_DRINK = 10;

const methods = [
  { key: 'wallet', icon: '💰', labelKey: 'wallet_method' },
  { key: 'stcpay', icon: '📱', labelKey: 'stcpay_method' },
  { key: 'credit', icon: '💳', labelKey: 'credit_method' },
] as const;

export default function PayModal({ isOpen, onClose, onPaymentSuccess }: { isOpen: boolean; onClose: () => void; onPaymentSuccess?: () => void }) {
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
  const earnedPoints = store.cart.reduce((s, i) => s + i.qty, 0) * POINTS_PER_DRINK;

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
      const itemHeight = 40;
      el.scrollTop = (selectedSlotIndex + 1) * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!wheelRef.current) return;
    const el = wheelRef.current;
    const itemHeight = 40;
    const idx = Math.round(el.scrollTop / itemHeight) - 1;
    if (idx >= 0 && idx < slots.length && idx !== selectedSlotIndex) {
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
    store.setSelectedPickupSlot(formatTime(slots[selectedSlotIndex]));
    await store.processPayment(method, selectedAddons);
    show(t('payment_successful', store.lang), 'success');
    onClose();
    onPaymentSuccess?.();
  };

  useEffect(() => {
    const el = document.getElementById('payModal');
    if (el) {
      if (isOpen) el.classList.add('open');
      else el.classList.remove('open');
    }
  }, [isOpen]);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const walletSufficient = store.wallet >= total;

  return (
    <div className="modal-overlay" id="payModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', left: 18, top: 22, fontSize: '1.3rem', fontWeight: 700 }}>✕</button>
        <div className="modal-title" style={{ fontSize: '1.25rem' }}>{t('pay_modal_title', store.lang)}</div>

        {/* Cafe summary card */}
        {store.selectedCafe && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--cream)', borderRadius: '14px',
            padding: '10px 14px', marginBottom: 10,
            border: '1px solid rgba(216,193,177,.1)',
          }}>
            <span style={{ fontSize: '1.5rem', width: 36, textAlign: 'center', flexShrink: 0 }}>
              {store.selectedCafe.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>
                {store.lang === 'ar' ? store.selectedCafe.name : store.selectedCafe.nameEn}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {store.selectedCafe.sub}
              </div>
            </div>
            <div style={{
              fontSize: '.65rem', fontWeight: 700,
              background: 'var(--amber)', color: '#fff',
              padding: '2px 8px', borderRadius: 40, whiteSpace: 'nowrap',
            }}>
              ⏱ ~{cafeWaitMin} {store.lang === 'ar' ? 'د' : 'min'}
            </div>
          </div>
        )}

        {/* Cart items */}
        <div style={{
          background: 'var(--cream)', borderRadius: '14px',
          padding: '10px 14px', marginBottom: 10,
          border: '1px solid rgba(216,193,177,.1)',
        }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            🛒 {t('cart_title', store.lang)?.replace(/^[^\s]*\s/, '') || 'Cart'}
          </div>
          {store.cart.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0',
              borderBottom: i < store.cart.length - 1 ? '1px solid var(--latte)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.4rem', width: 28, textAlign: 'center' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}><PriceTag value={item.price} /> × {item.qty}</div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--bark)' }}>
                <PriceTag value={item.price * item.qty} />
              </div>
            </div>
          ))}
          {subDiscount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '4px 0', fontSize: '.78rem', color: 'var(--green)', fontWeight: 700,
            }}>
              <span>💎 {t('sub_discount', store.lang) || 'Sub discount'} (-{subDiscount}%)</span>
              <span>-<PriceTag value={discountAmount} /></span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '8px 0 0', marginTop: 4,
            borderTop: '2px solid var(--latte)',
          }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>{t('cart_total', store.lang)}</div>
              <div style={{
                fontSize: '.7rem', fontWeight: 600, color: 'var(--amber)',
                marginTop: 1,
              }}>
                ⭐ +{earnedPoints} {t('loyalty_points_label', store.lang)}
              </div>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--bark)' }}>
              <PriceTag value={total} />
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {store.addons.length > 0 && (
          <div style={{
            background: 'var(--cream)', borderRadius: '14px',
            padding: '10px 14px', marginBottom: 10,
            border: '1px solid rgba(216,193,177,.1)',
          }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              🧃 {store.lang === 'ar' ? 'إضافات' : 'Add-ons'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {store.addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      background: isSelected ? 'var(--amber)' : 'var(--latte)',
                      color: '#111',
                      borderRadius: '16px', padding: '10px 4px',
                      textAlign: 'center', transition: 'all .2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(111,76,62,.25)' : 'var(--sh-sm)',
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>{addon.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '.82rem', marginBottom: 2, color: '#111' }}>
                      {store.lang === 'ar' ? addon.name : addon.nameEn}
                    </div>
                    <div style={{ fontSize: '.82rem', fontWeight: 800, color: '#111' }}>
                      +<PriceTag value={addon.price} />
                    </div>
                  </button>
                );
              })}
            </div>
            {addonTotal > 0 && (
              <div style={{
                fontSize: '.78rem', fontWeight: 700, textAlign: 'right',
                marginTop: 5, paddingTop: 4, borderTop: '1px solid var(--latte)',
                color: 'var(--text-main)',
              }}>
                {store.lang === 'ar' ? 'إجمالي الإضافات' : 'Add-ons total'}: <span style={{ color: '#111' }}>+<PriceTag value={addonTotal} /></span>
              </div>
            )}
          </div>
        )}

        {/* Pickup time */}
        <div style={{
          background: 'var(--cream)', borderRadius: '14px',
          padding: '10px 14px', marginBottom: 10,
          border: '1px solid rgba(216,193,177,.1)',
        }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, letterSpacing: '.5px', textAlign: 'center', textTransform: store.lang === 'ar' ? 'none' : 'uppercase' }}>
            ⏱️ {store.lang === 'ar' ? 'موعد الاستلام' : 'Pickup Time'}
          </div>
          {slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-light)', fontSize: '.8rem' }}>
              {store.lang === 'ar' ? 'لا توجد أوقات متاحة اليوم' : 'No available times today'}
            </div>
          ) : (
            <div style={{ position: 'relative', maxWidth: 200, margin: '0 auto' }}>
              <div className="time-wheel-highlight" />
              <div className="time-wheel-mask" ref={wheelRef} onScroll={handleScroll}>
                <div style={{ height: 40 }} />
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className={`time-wheel-item ${selectedSlotIndex === i ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSlotIndex(i);
                      if (wheelRef.current) {
                        wheelRef.current.scrollTop = (i + 1) * 40;
                      }
                    }}
                  >
                    {formatTime(slot, store.lang)}
                  </div>
                ))}
                <div style={{ height: 40 }} />
              </div>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div style={{
          background: 'var(--cream)', borderRadius: '14px',
          padding: '10px 14px', marginBottom: 10,
          border: '1px solid rgba(216,193,177,.1)',
        }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            💳 {store.lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {methods.map((m) => {
              const selected = method === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key as 'wallet' | 'stcpay' | 'credit')}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    background: selected ? 'var(--amber)' : 'var(--latte)',
                    color: selected ? '#fff' : 'var(--text-main)',
                    borderRadius: '40px', padding: '8px 4px',
                    textAlign: 'center', transition: 'all .2s',
                    fontSize: '.72rem', fontWeight: 700,
                    boxShadow: selected ? '0 4px 12px rgba(111,76,62,.2)' : 'var(--sh-sm)',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', display: 'block', marginBottom: 2 }}>{m.icon}</span>
                  {t(m.labelKey, store.lang).replace(/^[^\s]*\s/, '') || m.key}
                  {selected && (
                    <span style={{
                      position: 'absolute', top: -3, right: -3,
                      background: 'var(--green)', color: '#fff',
                      width: 16, height: 16, borderRadius: '50%',
                      fontSize: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
          {method === 'wallet' && (
            <div style={{
              marginTop: 6, padding: '6px 10px', borderRadius: '40px',
              background: walletSufficient ? 'var(--green-bg)' : 'var(--red-bg)',
              color: walletSufficient ? 'var(--green)' : 'var(--red)',
              textAlign: 'center', fontSize: '.78rem', fontWeight: 700,
            }}>
              {walletSufficient
                ? `${t('wallet_balance', store.lang) || 'Wallet'}: ${store.wallet.toFixed(2)}`
                : `${(t('insufficient_balance', store.lang))} — ${store.wallet.toFixed(2)} / ${total.toFixed(2)}`}
            </div>
          )}
          {method === 'credit' && (
            <div style={{
              marginTop: 6, padding: '6px 10px', borderRadius: '40px',
              background: 'var(--blue-bg)', color: 'var(--blue)',
              textAlign: 'center', fontSize: '.78rem', fontWeight: 600,
            }}>
              💳 {store.lang === 'ar' ? 'بطاقة ائتمان / خصم' : 'Credit / Debit Card'}
            </div>
          )}
        </div>

        {/* Pay button */}
        <button
          className="action-btn"
          style={{ width: '100%', padding: 12, fontSize: '1rem', fontWeight: 800, borderRadius: '40px' }}
          onClick={handlePay}
        >
          {t('confirm_payment', store.lang)} — <PriceTag value={total} />
        </button>
      </div>
    </div>
  );
}
