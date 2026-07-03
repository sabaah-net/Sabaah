'use client';
import type { CoffeeItem } from '../../types';

const coffeeNames: Record<string, string> = {
  black: 'سوداء', white: 'بيضاء', iced: 'مثلجة', spanish: 'إسباني', turkish: 'تركية', mocha: 'موكا',
};
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
  if (cart.length === 0) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="coffee-panel" style={{ marginTop: 10 }}>
      <p className="section-title">🛒 سلة الطلب</p>
      <div id="cartItemsList">
        {cart.map((item) => {
          const itemTotal = item.price * item.qty;
          return (
            <div key={item.type} className="cart-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: '1.4rem' }}>{coffeeIcons[item.type] || '☕'}</div>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{coffeeNames[item.type] || item.name}</div>
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
        <span>الإجمالي</span>
        <span>{total.toFixed(2)} ⃁</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="action-btn secondary" style={{ flex: 1, fontSize: '.8rem' }} onClick={onClear}>🗑️ إفراغ</button>
        <button className="action-btn" style={{ flex: 1 }} onClick={onPlaceOrder}>🛒 تأكيد الطلب والدفع</button>
      </div>
    </div>
  );
}
