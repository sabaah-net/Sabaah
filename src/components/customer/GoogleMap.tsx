'use client';
import { useEffect, useRef, useState } from 'react';
import type { Cafe } from '../../types';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  cafes: Cafe[];
  selectedCafeId?: number;
  onSelectCafe?: (cafe: Cafe) => void;
  height?: string;
}

const MARKER_IMG = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };

export default function GoogleMap({ cafes, selectedCafeId, onSelectCafe, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'INSERT_YOUR_API_KEY') {
      setError('Map unavailable — API key not configured');
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        setLoaded(true);
      } else {
        setError('Marker library not loaded');
      }
    };
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;
    const { Map } = window.google.maps;
    mapRef.current = new Map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      mapId: 'SABAAH_MAP',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    });
  }, [loaded]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    markersRef.current.forEach((m) => m.setMap?.(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValid = false;

    cafes.forEach((cafe) => {
      if (!cafe.lat || !cafe.lng) return;
      const position = { lat: cafe.lat, lng: cafe.lng };

      let marker: any;
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position,
          title: cafe.name,
          content: createMarkerContent(cafe),
        });
      } else {
        marker = new window.google.maps.Marker({
          map: mapRef.current,
          position,
          title: cafe.name,
          icon: {
            url: MARKER_IMG,
            scaledSize: new window.google.maps.Size(28, 34),
            anchor: new window.google.maps.Point(14, 34),
          },
        });
      }

      marker.addListener('click', () => onSelectCafe?.(cafe));
      markersRef.current.push(marker);
      bounds.extend(position);
      hasValid = true;
    });

    if (hasValid && cafes.length > 0) {
      if (cafes.length === 1) {
        mapRef.current.setCenter({ lat: cafes[0].lat, lng: cafes[0].lng });
        mapRef.current.setZoom(15);
      } else {
        mapRef.current.fitBounds(bounds, 50);
      }
    }
  }, [cafes, loaded]);

  useEffect(() => {
    markersRef.current.forEach((m) => {
      if (!m.title) return;
      const cafe = cafes.find((c) => c.name === m.title);
      if (!cafe) return;
      const isSelected = cafe.id === selectedCafeId;
      if (m.content) {
        m.content.style.transform = isSelected ? 'scale(1.3)' : 'scale(1)';
        m.content.style.filter = isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,.4))' : 'none';
        m.content.style.zIndex = isSelected ? '10' : '1';
      }
    });
  }, [selectedCafeId, cafes]);

  if (error) {
    return (
      <div style={{ height, background: 'var(--latte)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '.8rem', padding: 16, textAlign: 'center' }}>
        ⚠ {error}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{ height, background: 'var(--latte)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '.8rem' }}>
        Loading map...
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 'var(--r-md)', overflow: 'hidden' }} />;
}

function createMarkerContent(cafe: Cafe): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;cursor:pointer;';

  const img = document.createElement('img');
  img.src = MARKER_IMG;
  img.style.cssText = 'width:28px;height:34px;';
  wrapper.appendChild(img);

  const badge = document.createElement('div');
  badge.style.cssText = `
    position:absolute;top:-4px;left:-4px;
    width:18px;height:18px;border-radius:50%;
    background:${cafe.isOpen ? '#d4a24c' : '#c0392b'};
    color:#fff;font-size:9px;font-weight:900;
    display:flex;align-items:center;justify-content:center;
    border:2px solid #fff;
  `;
  badge.textContent = cafe.id.toString();
  wrapper.appendChild(badge);

  return wrapper;
}