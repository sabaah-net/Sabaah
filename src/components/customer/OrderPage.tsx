'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getGreeting, t } from '../../i18n';
import { generatePickupCode, useToast } from '../../lib/utils';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import CafeCard from './CafeCard';
import CoffeePanel from './CoffeePanel';
import CartPanel from './CartPanel';
import type { CoffeeItem } from '../../types';

export default function OrderPage({ onOpenPay, onOpenVoice }: { onOpenPay: () => void; onOpenVoice: () => void }) {
  const store = useAppStore();
  const { show } = useToast();
  const [mapExpanded, setMapExpanded] = useState(true);
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
  const visibleCafes = store.cafes.filter((cafe) => cafe.isOpen);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || googleMapRef.current) return;

      try {
        setOptions({
          key: 'AIzaSyBmWwqydqnjF10ZMRK3uhn_j5pOZTZQMmQ',
          libraries: ['places', 'marker'],
        });

        await importLibrary('maps');
        await importLibrary('marker');

        if (!window.google?.maps) throw new Error('google.maps not available after loading');
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 24.7136, lng: 46.6753 },
          zoom: 12,
          mapId: '96d92d20372ba6e0cda09de9',
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E8DDD0' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F9F4EE' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#EBE0D2' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#EBE0D2' }] },
            { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#F9F4EE' }] },
            { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#5C4033' }] },
          ],
        });

        googleMapRef.current = map;
        setMapLoaded(true);
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
  }, [visibleCafes]);

  const updateMapMarkers = (map: google.maps.Map) => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    visibleCafes.forEach((cafe) => {
      if (!cafe.lat || !cafe.lng) return;

      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          width: 46px; height: 46px; border-radius: 50%;
          background: ${cafe.isOpen ? 'var(--amber)' : 'var(--red)'};
          border: 3px solid #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,.25), 0 0 0 4px ${cafe.isOpen ? 'rgba(217,119,36,.2)' : 'rgba(192,57,43,.2)'};
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; cursor: pointer;
          transition: transform .2s;
        " title="${cafe.name}">
          ${cafe.emoji || cafe.name?.charAt(0) || '☕'}
        </div>
      `;
      const content = markerEl.firstElementChild as HTMLElement;
      content.addEventListener('mouseenter', () => { content.style.transform = 'scale(1.15)'; });
      content.addEventListener('mouseleave', () => { content.style.transform = 'scale(1)'; });

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: cafe.lat, lng: cafe.lng },
        map,
        title: cafe.name,
        content,
      });

      marker.addListener('click', () => handleSelectCafe(cafe));
      markersRef.current.push(marker as any);
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
            {store.orders.slice(0, 3).map((o, idx) => (
              <div
                key={`${o.id}-${idx}`}
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
                <div className="reorder-price"><span className="currency-sym">﷼</span>{(o.amount || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={`map-wrap ${mapExpanded ? 'expanded' : 'collapsed'}`}>
        <div ref={mapRef} style={{ display: mapLoaded ? 'block' : 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 'var(--r-md)' }} />
        {!mapLoaded && (
          <svg className="map-svg-el" viewBox="0 0 480 280" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect width="480" height="280" fill="#E8DDD0" />
            {visibleCafes.map((c) => (
              <g key={c.id} style={{ cursor: 'pointer' }} transform={`translate(${c.x}, ${c.y})`} onClick={() => handleSelectCafe(c)}>
                <circle r="18" fill={c.isOpen ? 'var(--amber)' : 'var(--red)'} opacity="0.15" />
                <circle r="10" fill={c.isOpen ? 'var(--amber)' : 'var(--red)'} stroke="#fff" strokeWidth="2" />
                <text y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">{c.id}</text>
              </g>
            ))}
            <circle id="userDot" cx="240" cy="128" r="5" fill="#1A6FA8" />
            <circle cx="240" cy="128" r="13" fill="#1A6FA8" opacity=".15" />
          </svg>
        )}
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
