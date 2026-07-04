'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getGreeting, t } from '../../i18n';
import { generatePickupCode, useToast } from '../../lib/utils';
import CafeCard from './CafeCard';
import CoffeePanel from './CoffeePanel';
import CartPanel from './CartPanel';
import type { CoffeeItem } from '../../types';

export default function OrderPage({ onOpenPay }: { onOpenPay: () => void }) {
  const store = useAppStore();
  const { show } = useToast();
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    store.refreshCafes();
    const interval = setInterval(() => store.refreshCafes(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCafe = (cafe: typeof store.cafes[0]) => {
    store.setSelectedCafe(cafe);
    show(t('cafe_selected', store.lang).replace('{name}', cafe.name), 'success');
  };

  const handleToggleFav = (id: number) => {
    const cafe = store.cafes.find((c) => c.id === id);
    if (cafe) {
      cafe.favorited = !cafe.favorited;
      show(t(cafe.favorited ? 'cafe_favorited_add' : 'cafe_favorited_remove', store.lang), 'info');
    }
  };

  const handleAddToCart = (type: string) => {
    if (!store.selectedCafe) {
      show(t('cafe_select_first', store.lang), 'error');
      return;
    }
    const prices: Record<string, number> = { black: 7, white: 7, iced: 7, spanish: 9, turkish: 8, mocha: 10 };
    const icons: Record<string, string> = { black: '☕', white: '🥛', iced: '🧊', spanish: '🍯', turkish: '🫖', mocha: '🍫' };

    const existing = store.cart.find((item) => item.type === type);
    if (existing) {
      store.setCart(store.cart.map((item) =>
        item.type === type ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      store.setCart([...store.cart, { type, qty: 1, price: prices[type] || 7, name: t(type, store.lang), icon: icons[type] || '☕' }]);
    }
    show(t('added_to_cart', store.lang), 'success');
  };

  const handleUpdateQty = (type: string, delta: number) => {
    const item = store.cart.find((i) => i.type === type);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      store.setCart(store.cart.filter((i) => i.type !== type));
    } else {
      store.setCart(store.cart.map((i) => i.type === type ? { ...i, qty: newQty } : i));
    }
  };

  const handleClearCart = () => {
    store.setCart([]);
    show(t('cart_cleared', store.lang), 'info');
  };

  const handlePlaceOrder = () => {
    if (!store.selectedCafe) { show(t('cafe_select_first', store.lang), 'error'); return; }
    if (store.cart.length === 0) { show(t('need_items', store.lang), 'error'); return; }
    if (!store.isLoggedIn) { show(t('login_required', store.lang), 'info'); return; }
    onOpenPay();
  };

  const selectedTypes = store.cart.map((item) => item.type);

  return (
    <div className="view active" id="pageOrder">
      <div className="hero-banner">
        <div className="hero-greeting">{getGreeting(store.lang)}</div>
        <div className="hero-name">
          {store.isLoggedIn && store.currentUser
            ? `${t('greeting_prefix', store.lang)}${store.currentUser.name}`
            : t('greeting_default', store.lang)}
        </div>
        {store.currentUser && (
          <div className="hero-streak">🔥 {store.currentUser.streak} {t('streak_label', store.lang)}</div>
        )}
      </div>

      {store.orders.length > 0 && (
        <>
          <p className="section-title">{t('order_again', store.lang)}</p>
          <div className="smart-reorder">
            {store.orders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="reorder-chip"
                onClick={() => {
                  const cafe = store.cafes.find((c) => c.name === o.cafe);
                  if (cafe) {
                    store.setSelectedCafe(cafe);
                    show(t('quick_order_added', store.lang), 'success');
                  }
                }}
              >
                <div className="reorder-title">{o.icon} {o.coffeeAr || o.coffee}</div>
                <div className="reorder-meta">{o.cafe}</div>
                <div className="reorder-price">{o.amount.toFixed(2)} ⃁</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={`map-wrap ${mapExpanded ? 'expanded' : 'collapsed'}`}>
        <svg className="map-svg-el" viewBox="0 0 480 280">
          <rect width="480" height="280" fill="#E8DDD0" />
          <rect x="0" y="120" width="480" height="16" fill="#D0C0A8" rx="2" />
          <rect x="72" y="0" width="14" height="280" fill="#D0C0A8" rx="2" />
          <rect x="332" y="0" width="14" height="280" fill="#D0C0A8" rx="2" />
          {store.cafes.map((c) => (
            <g key={c.id} style={{ cursor: 'pointer' }} transform={`translate(${c.x}, ${c.y})`} onClick={() => handleSelectCafe(c)}>
              <circle r="18" fill={c.isOpen ? 'var(--amber)' : 'var(--red)'} opacity="0.15" />
              <circle r="10" fill={c.isOpen ? 'var(--amber)' : 'var(--red)'} stroke="#fff" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">{c.id}</text>
            </g>
          ))}
          <circle id="userDot" cx="240" cy="128" r="5" fill="#1A6FA8" />
          <circle cx="240" cy="128" r="13" fill="#1A6FA8" opacity=".15" />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="action-btn secondary" style={{ fontSize: '.8rem', padding: 8 }} onClick={() => setMapExpanded(!mapExpanded)}>
          {mapExpanded ? t('map_hide', store.lang) : t('map_show', store.lang)}
        </button>
        <button className="action-btn secondary" style={{ fontSize: '.8rem', padding: 8 }}>{t('group_order', store.lang)}</button>
      </div>

      <p className="section-title">{t('choose_cafe', store.lang)}</p>
      <div className="cafe-list">
        {store.cafes.map((cafe) => (
          <CafeCard
            key={cafe.id}
            cafe={cafe}
            selected={store.selectedCafe?.id === cafe.id}
            lang={store.lang}
            onSelect={handleSelectCafe}
            onToggleFav={handleToggleFav}
          />
        ))}
      </div>

      <CoffeePanel
        visible={!!store.selectedCafe}
        onAddToCart={handleAddToCart}
        selectedTypes={selectedTypes}
      />

      <CartPanel
        cart={store.cart}
        onUpdateQty={handleUpdateQty}
        onClear={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="voice-btn" onClick={() => show(t('voice_order', store.lang), 'info')}>🎙️</button>
        <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{t('voice_label', store.lang)}</div>
      </div>
    </div>
  );
}
