'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { Cafe } from '../../types';
import { haversineDistance } from '../../lib/geolocation';
import { useAppStore } from '../../store/useAppStore';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  cafes: Cafe[];
  selectedCafeId?: number;
  onSelectCafe?: (cafe: Cafe) => void;
  onNearbyCafe?: (cafe: Cafe) => void;
  height?: string;
}

const SIMULATED_USER_POS = { lat: 24.7136, lng: 46.6753 };
const MAX_RADIUS_M = 10000;

const SCRIPT_ID = '__sabaaMaps';
let scriptLoading = false;

const ICON_W = 60, ICON_H = 108, CX = 30, CY = 28, R = 20;

function drawRoundShape(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, R + 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(CX, CY, R + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawDot(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(48, 42, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawName(ctx: CanvasRenderingContext2D, nameEn: string) {
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const maxW = ICON_W - 10;
  const words = nameEn.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length) lines.push(nameEn);
  const lineH = 12;
  const startY = 54;
  lines.forEach((l, i) => {
    ctx.fillText(l, CX, startY + i * lineH);
  });
}

function drawFallbackIcon(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#d4a24c';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☕', CX, CY);
}

function createIconUrl(logoUrl: string | null | undefined, nameEn: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = ICON_W;
    canvas.height = ICON_H;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, ICON_W, ICON_H);

    drawRoundShape(ctx);

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R - 2, 0, Math.PI * 2);
    ctx.clip();

    if (logoUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      const fallback = () => {
        drawFallbackIcon(ctx);
        ctx.restore();
        drawDot(ctx);
        drawName(ctx, nameEn);
        resolve(canvas.toDataURL());
      };
      const t = setTimeout(fallback, 5000);
      img.onload = () => {
        clearTimeout(t);
        ctx.drawImage(img, CX - (R - 5), CY - (R - 5), (R - 5) * 2, (R - 5) * 2);
        ctx.restore();
        drawDot(ctx);
        drawName(ctx, nameEn);
        resolve(canvas.toDataURL());
      };
      img.onerror = fallback;
      img.src = logoUrl;
    } else {
      drawFallbackIcon(ctx);
      ctx.restore();
      drawDot(ctx);
      drawName(ctx, nameEn);
      resolve(canvas.toDataURL());
    }
  });
}

export default function GoogleMap({ cafes, selectedCafeId, onSelectCafe, onNearbyCafe, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const notifiedRef = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUserPosition = useAppStore((s) => s.setUserPosition);

  useEffect(() => {
    setUserPosition(SIMULATED_USER_POS);
  }, []);

  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;
    if (scriptLoading) return;
    scriptLoading = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'INSERT_YOUR_API_KEY') {
      setError('Map unavailable — API key not configured');
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry,places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    const poll = setInterval(() => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        clearInterval(poll);
        setReady(true);
      }
    }, 200);
    setTimeout(() => clearInterval(poll), 20000);
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    try {
      const { Map } = window.google.maps;
      mapRef.current = new Map(containerRef.current, {
        center: SIMULATED_USER_POS,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        mapId: '96d92d20372ba6e0cda09de9',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to initialize map');
    }
  }, [ready]);

  const nearbyCafes = useMemo(() => {
    const { lat: uLat, lng: uLng } = SIMULATED_USER_POS;
    return cafes.filter((c) => {
      if (!c.lat || !c.lng) return false;
      if (!c.isOpen) return false;
      if (c.status && c.status !== 'active') return false;
      let d: number;
      if (window.google?.maps?.geometry?.spherical) {
        d = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(uLat, uLng),
          new window.google.maps.LatLng(c.lat, c.lng)
        );
      } else {
        d = haversineDistance(uLat, uLng, c.lat, c.lng);
      }
      return d <= MAX_RADIUS_M;
    });
  }, [cafes, ready]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    markersRef.current.forEach((m) => { try { m.map = null; } catch {} });
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValid = false;
    let cancelled = false;

    Promise.all(
      nearbyCafes.map((cafe) =>
        createIconUrl(cafe.logo_url, cafe.nameEn || cafe.name).then((url) => {
          if (cancelled || !cafe.lat || !cafe.lng) return;
          const position = { lat: cafe.lat, lng: cafe.lng };

          const wrapper = document.createElement('div');
          wrapper.style.width = `${ICON_W}px`;
          wrapper.style.height = `${ICON_H}px`;
          wrapper.style.position = 'relative';

          const img = document.createElement('img');
          img.src = url;
          img.style.width = `${ICON_W}px`;
          img.style.height = `${ICON_H}px`;
          img.style.display = 'block';
          img.draggable = false;
          wrapper.appendChild(img);

          try {
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current,
              position,
              content: wrapper,
              gmpDraggable: false,
            });

            marker.addListener('click', () => onSelectCafe?.(cafe));
            markersRef.current.push(marker);
            bounds.extend(position);
            hasValid = true;
          } catch {}
        })
      )
    ).then(() => {
      if (cancelled) return;
      if (hasValid && nearbyCafes.length > 0) {
        if (nearbyCafes.length === 1) {
          mapRef.current.setCenter({ lat: nearbyCafes[0].lat, lng: nearbyCafes[0].lng });
          mapRef.current.setZoom(15);
        } else {
          mapRef.current.fitBounds(bounds, 50);
        }
      }
    });

    return () => { cancelled = true; };
  }, [nearbyCafes, ready]);

  useEffect(() => {
    if (!onNearbyCafe || !window.google?.maps?.geometry?.spherical) return;
    const { lat: uLat, lng: uLng } = SIMULATED_USER_POS;
    const userLatLng = new window.google.maps.LatLng(uLat, uLng);

    nearbyCafes.forEach((cafe) => {
      if (!cafe.lat || !cafe.lng) return;
      if (notifiedRef.current.has(cafe.id)) return;
      const cafeLatLng = new window.google.maps.LatLng(cafe.lat, cafe.lng);
      const dist = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, cafeLatLng);
      if (dist <= 250) {
        notifiedRef.current.add(cafe.id);
        onNearbyCafe(cafe);
      }
    });
  }, [nearbyCafes, onNearbyCafe]);

  if (error) {
    return (
      <div style={{ height, background: 'var(--latte)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '.8rem', padding: 16, textAlign: 'center' }}>
        ⚠ {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height, background: 'var(--latte)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '.8rem' }}>
        Loading map...
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 'var(--r-md)', overflow: 'hidden' }} />;
}
