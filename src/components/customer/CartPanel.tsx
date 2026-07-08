'use client';
import type { CoffeeItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

const coffeeIcons: Record<string, string> = {
  black: '☕', white: '🥛', iced: '🧊', spanish: '🍯', turkish: '🫖', mocha: '🍫',
};

interface CartPanelProps {
  cart: CoffeeItem[];
  onUpdateQty: (type: string, delta: number) => void;
  onPlaceOrder: () => void;
}

export default function CartPanel({ cart, onUpdateQty, onPlaceOrder }: CartPanelProps) {
  const store = useAppStore();
  if (cart.length === 0) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vatAmount = total * 0.15;
  const totalWithVat = total + vatAmount;

  return (
    <div className="coffee-panel" style={{ marginTop: 10 }}>
      <p className="section-title">{t('cart_title', store.lang)}</p>
      <div id="cartItemsList">
        {cart.map((item) => {
          const itemTotal = item.price * item.qty;
          return (
            <div key={item.type} className="cart-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: '1.4rem' }}>{coffeeIcons[item.type] || '☕'}</div>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{t(item.type, store.lang)}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}><span className="currency-sym">⃁</span>{item.price.toFixed(2)} × {item.qty}</div>
                </div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => onUpdateQty(item.type, -1)}>−</button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => onUpdateQty(item.type, 1)}>+</button>
              </div>
              <div style={{ fontWeight: 900, color: 'var(--amber)', fontSize: '.9rem' }}><span className="currency-sym">⃁</span>{itemTotal.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
      <div className="cart-total-row">
        <span>{t('cart_total', store.lang)}</span>
        <span><span className="currency-sym">⃁</span>{total.toFixed(2)}</span>
      </div>
      <div className="cart-total-row" style={{ fontSize: '.75rem', color: 'var(--text-light)' }}>
        <span>{t('th_vat', store.lang)} (15%)</span>
        <span><span className="currency-sym">⃁</span>{vatAmount.toFixed(2)}</span>
      </div>
      <div className="cart-total-row" style={{ borderTop: '2px solid var(--latte)', paddingTop: 6, marginTop: 4 }}>
        <span style={{ fontWeight: 900 }}>{t('cart_total', store.lang)} {t('vat_desc', store.lang)}</span>
        <span style={{ fontWeight: 900, color: 'var(--amber)', fontSize: '1rem' }}><span className="currency-sym">⃁</span>{totalWithVat.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="action-btn" style={{ flex: 1 }} onClick={onPlaceOrder}>{t('cart_checkout', store.lang)}</button>
      </div>
    </div>
  );
}
