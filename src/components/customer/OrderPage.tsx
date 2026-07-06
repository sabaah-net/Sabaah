'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../../store/useAppStore';
import { getGreeting, t } from '../../i18n';
import { generatePickupCode, useToast } from '../../lib/utils';
import CafeCard from './CafeCard';
import CoffeePanel from './CoffeePanel';
import CartPanel from './CartPanel';
import type { CoffeeItem } from '../../types';

const GoogleMap = dynamic(() => import('./GoogleMap'), { ssr: false });

export default function OrderPage({ onOpenPay, onOpenVoice }: { onOpenPay: () => void; onOpenVoice: () => void }) {
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
    setTimeout(() => {
      document.getElementById('coffeePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
                <div className="reorder-price">﷼ {o.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={`map-wrap ${mapExpanded ? 'expanded' : 'collapsed'}`}
        style={{ height: mapExpanded ? '400px' : '180px', transition: 'height .3s ease', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 12 }}>
        <Suspense fallback={<div style={{ height: '100%', background: 'var(--latte)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '.8rem' }}>Loading map...</div>}>
          <GoogleMap
            cafes={store.cafes}
            selectedCafeId={store.selectedCafe?.id}
            onSelectCafe={handleSelectCafe}
            height={mapExpanded ? '400px' : '180px'}
          />
        </Suspense>
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
          />
        ))}
      </div>

      <div id="coffeePanel">
        <CoffeePanel
          visible={!!store.selectedCafe}
          onAddToCart={handleAddToCart}
          selectedTypes={selectedTypes}
        />
      </div>

      <CartPanel
        cart={store.cart}
        onUpdateQty={handleUpdateQty}
        onPlaceOrder={handlePlaceOrder}
      />

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="voice-btn" onClick={onOpenVoice}>🎙️</button>
        <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{t('voice_label', store.lang)}</div>
      </div>
    </div>
  );
}
