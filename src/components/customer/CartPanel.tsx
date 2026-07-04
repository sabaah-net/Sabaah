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
  onClear: () => void;
  onPlaceOrder: () => void;
}

export default function CartPanel({ cart, onUpdateQty, onClear, onPlaceOrder }: CartPanelProps) {
  const store = useAppStore();
  if (cart.length === 0) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

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
                  <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{item.price.toFixed(2)} ⃁ × {item.qty}</div>
                </div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => onUpdateQty(item.type, -1)}>−</button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => onUpdateQty(item.type, 1)}>+</button>
              </div>
              <div style={{ fontWeight: 900, color: 'var(--amber)', fontSize: '.9rem' }}>{itemTotal.toFixed(2)} ⃁</div>
            </div>
          );
        })}
      </div>
      <div className="cart-total-row">
        <span>{t('cart_total', store.lang)}</span>
        <span>{total.toFixed(2)} ⃁</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="action-btn secondary" style={{ flex: 1, fontSize: '.8rem' }} onClick={onClear}>{t('cart_clear', store.lang)}</button>
        <button className="action-btn" style={{ flex: 1 }} onClick={onPlaceOrder}>{t('cart_checkout', store.lang)}</button>
      </div>
    </div>
  );
}
