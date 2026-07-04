'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useToast } from '../shared/Toast';

function generatePickupSlots(avgWaitMin: number = 5): { time: Date; label: string; disabled: boolean }[] {
  const now = new Date();
  let firstOffset = Math.max(15, avgWaitMin);
  firstOffset = Math.ceil(firstOffset / 15) * 15;
  const slots: { time: Date; label: string; disabled: boolean }[] = [];
  for (let i = 0; i < 4; i++) {
    const offset = firstOffset + i * 15;
    const slotTime = new Date(now.getTime() + offset * 60 * 1000);
    slots.push({
      time: slotTime,
      label: i === 0 ? 'priority' : '',
      disabled: false,
    });
  }
  return slots;
}

function formatTime(d: Date, lang: string): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function PayModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [method, setMethod] = useState<'wallet' | 'card' | 'cash'>('wallet');
  const cafeWaitMin = store.selectedCafe?.avg_wait_min || 5;
  const slots = useMemo(() => generatePickupSlots(cafeWaitMin), [cafeWaitMin]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  const total = store.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotal = total / 1.15;
  const vat = total - subtotal;

  const handlePay = () => {
    if (method === 'wallet' && store.wallet < total) {
      show(t('insufficient_balance', store.lang), 'error');
      return;
    }
    store.setSelectedPickupSlot(formatTime(slots[selectedSlotIndex].time, store.lang));
    store.processPayment(method);
    show(t('payment_successful', store.lang), 'success');
    closeModal();
  };

  const closeModal = () => document.getElementById('payModal')?.classList.remove('open');

  const methodLabels: Record<string, { icon: string; key: string }> = {
    wallet: { icon: '💰', key: 'wallet_method' },
    card: { icon: '💳', key: 'card_method' },
    cash: { icon: '💵', key: 'cash_method' },
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
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{item.name}</div>
                  <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{item.qty} × {item.price.toFixed(2)} ⃁</div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '.88rem', color: 'var(--bark)' }}>{(item.price * item.qty).toFixed(2)} ⃁</div>
            </div>
          ))}
          <div className="cart-total-row" style={{ fontSize: '.95rem', padding: '8px 0 0' }}>
            <span>{t('cart_total', store.lang)}</span>
            <span>{total.toFixed(2)} ⃁</span>
          </div>
        </div>

        {/* Pickup time slots */}
        <div className="time-slots-container" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 8 }}>⏱️ {t('pickup_time', store.lang) || 'Pickup Time'}</div>
          <div className="time-slots-grid">
            {slots.map((slot, i) => (
              <button
                key={i}
                className={`time-slot-btn ${selectedSlotIndex === i ? 'selected' : ''} ${slot.disabled ? 'disabled' : ''}`}
                onClick={() => !slot.disabled && setSelectedSlotIndex(i)}
                disabled={slot.disabled}
              >
                <span className="slot-time">{formatTime(slot.time, store.lang)}</span>
                <span className="slot-label">{slot.label === 'priority' ? (store.lang === 'ar' ? 'أقرب موعد' : 'Earliest') : ''}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {(['wallet', 'card', 'cash'] as const).map((m) => (
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
            {t('wallet_balance', store.lang)}: {store.wallet.toFixed(2)} ⃁
            {store.wallet < total && ` — ${t('insufficient_balance', store.lang)}`}
          </div>
        )}

        <button className="action-btn" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handlePay}>
          {t('confirm_payment', store.lang)} — {total.toFixed(2)} ⃁
        </button>
      </div>
    </div>
  );
}
