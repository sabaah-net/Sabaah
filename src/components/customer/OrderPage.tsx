'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getGreeting, t } from '../../i18n';
import { generatePickupCode, useToast } from '../../lib/utils';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import CafeCard from './CafeCard';
import CoffeePanel from './CoffeePanel';
import CartPanel from './CartPanel';
import type { CoffeeItem } from '../../types';

// Google Maps type declarations
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: HTMLDivElement, options?: any);
      }
      class Marker {
        constructor(options?: any);
        addListener(eventName: string, handler: () => void): void;
        setMap(map: Map | null): void;
      }
      namespace SymbolPath {
        const CIRCLE: any;
      }
    }
  }
}

export default function OrderPage({ onOpenPay, onOpenVoice }: { onOpenPay: () => void; onOpenVoice: () => void }) {
  const store = useAppStore();
  const { show } = useToast();
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || googleMapRef.current) return;

      try {
        // Set API options using new functional API
        setOptions({
          key: 'AIzaSyBmWwqydqnjF10ZMRK3uhn_j5pOZTZQMmQ',
          libraries: ['places'],
        });

        // Import the maps library
        await importLibrary('maps');
        
        // @ts-ignore - google.maps is loaded dynamically
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 24.7136, lng: 46.6753 }, // Riyadh coordinates
          zoom: 12,
          mapId: '96d92d20372ba6e0cda09de9',
          disableDefaultUI: true,
          zoomControl: true,
        });

        googleMapRef.current = map;
        updateMapMarkers(map);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, []);

  // Update markers when cafes change
  useEffect(() => {
    if (googleMapRef.current) {
      updateMapMarkers(googleMapRef.current);
    }
  }, [store.cafes]);

  const updateMapMarkers = (map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for cafes
    store.cafes.forEach((cafe) => {
      const marker = new google.maps.Marker({
        position: { 
          lat: 24.7136 + ((cafe.y || 50) - 50) * 0.01, 
          lng: 46.6753 + ((cafe.x || 50) - 50) * 0.01 
        },
        map: map,
        title: cafe.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: cafe.isOpen ? '#C0692A' : '#C0392B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => handleSelectCafe(cafe));
      markersRef.current.push(marker);
    });
  };

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
                  <div className="reorder-price">⃁ {(o.amount || 0).toFixed(2)}</div>
                </div>
              ))}
          </div>
        </>
      )}

      <div className={`map-wrap ${mapExpanded ? 'expanded' : 'collapsed'}`}>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            background: 'var(--latte)',
            borderRadius: 'var(--radius-sm)'
          }} 
        />
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
        <button className="voice-btn" onClick={onOpenVoice}>🎙️</button>
        <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>{t('voice_label', store.lang)}</div>
      </div>
    </div>
  );
}
