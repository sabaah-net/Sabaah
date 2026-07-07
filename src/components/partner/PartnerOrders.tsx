'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { watchAllOrders, updateOrderStatusInFirebase, verifyPickupCodeOnce } from '../../lib/firebase';
import { t } from '../../i18n';
import { useToast } from '../shared/Toast';

export default function PartnerOrders() {
  const store = useAppStore();
  const { show } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [showGreenOverlay, setShowGreenOverlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/verify.mp3');
  }, []);

  const cafeKeys = [
    store.selectedCafe?.cafe_uuid,
    store.selectedCafe?.id,
    store.selectedCafe?.name,
    store.selectedCafe?.nameEn,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  const matchesCafe = (o: any) => {
    if (cafeKeys.length === 0) return true;
    const tokens = [o.cafeId, o.cafe_uuid, o.cafe, o.cafe_name, o.cafeName]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return tokens.some((token) => cafeKeys.includes(token));
  };

  useEffect(() => {
    return watchAllOrders((allOrders) => {
      const filtered = allOrders.filter(matchesCafe);
      filtered.sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || a.date || 0).getTime();
        const bTime = new Date(b.createdAt || b.date || 0).getTime();
        return bTime - aTime;
      });
      setOrders(filtered);
    });
  }, [store.selectedCafe?.cafe_uuid, store.selectedCafe?.id, store.selectedCafe?.name, store.selectedCafe?.nameEn]);

  const handleVerifyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    const cafeRef = store.selectedCafe?.cafe_uuid ?? store.selectedCafe?.id ?? store.selectedCafe?.name ?? undefined;
    const result = await verifyPickupCodeOnce(cafeRef, code);
    if (!result) {
      show(store.lang === 'ar' ? 'رمز غير صالح أو تم استخدامه' : 'Invalid or already used code', 'error');
      return;
    }

    setVerifiedCode(code);
    setShowGreenOverlay(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setTimeout(() => setShowGreenOverlay(false), 2000);
    setCodeInput('');
    show(store.lang === 'ar' ? 'تم التحقق بنجاح' : 'Verified successfully', 'success');
  };

  const handleMarkReady = async (order: any) => {
    if (!order.userId) return;
    await updateOrderStatusInFirebase(order.userId, order.id, 'ready');
  };

  const handleMarkPicked = async (order: any) => {
    if (!order.userId) return;
    await updateOrderStatusInFirebase(order.userId, order.id, 'completed');
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'ready');
  const historyOrders = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div id="pagePartner" style={{ paddingBottom: 80, position: 'relative' }}>
      {showGreenOverlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(34,197,94,.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', animation: 'fadeIn .2s ease',
        }}>
          <div style={{ fontSize: '5rem', marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{store.lang === 'ar' ? 'تم التحقق!' : 'Verified!'}</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'JetBrains Mono', marginTop: 8, letterSpacing: 4 }}>
            {verifiedCode}
          </div>
        </div>
      )}

      <div style={{
        background: '#fff', borderRadius: 'var(--r-md)', padding: 16,
        boxShadow: '0 0 0 1px rgba(15,10,8,.04), 0 4px 12px rgba(15,10,8,.06)',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          🔑 {store.lang === 'ar' ? 'التحقق من رمز الاستلام' : 'Verify Pickup Code'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="coffee-input"
            style={{ flex: 1, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '1.1rem', letterSpacing: 3 }}
            placeholder={store.lang === 'ar' ? 'أدخل الرمز' : 'Enter code'}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          />
          <button className="action-btn" style={{ padding: '0 18px', fontSize: '.8rem' }} onClick={handleVerifyCode}>
            {store.lang === 'ar' ? 'تحقق' : 'Verify'}
          </button>
        </div>
      </div>

      <p className="section-title">🟡 {store.lang === 'ar' ? 'الطلبات النشطة' : 'Active Orders'}</p>
      {pendingOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: '.85rem' }}>
          {store.lang === 'ar' ? 'لا توجد طلبات نشطة' : 'No active orders'}
        </div>
      ) : (
        pendingOrders.map((o, idx) => (
          <div key={`${o.userId}-${o.id}-${idx}`} style={{
            background: '#fff', borderRadius: 'var(--r-md)', padding: 12,
            boxShadow: '0 0 0 1px rgba(15,10,8,.04), 0 4px 12px rgba(15,10,8,.06)',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>#{String(o.id || '').slice(0, 6)}</div>
              <div style={{
                fontSize: '.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: o.status === 'pending' ? 'var(--amber)' : 'var(--green)',
                color: '#fff',
              }}>
                {o.status === 'pending' ? 'Pending' : 'Ready'}
              </div>
            </div>
            <div style={{ fontSize: '.82rem', marginBottom: 4, color: 'var(--text-main)' }}>
              {(o.items || []).map((i: any) => i.name).join(', ')}
            </div>
            {o.pickupCode && (
              <div style={{
                fontSize: '.9rem', fontFamily: 'JetBrains Mono', fontWeight: 700,
                color: 'var(--amber)', marginBottom: 4,
              }}>
                🔑 {o.pickupCode}
              </div>
            )}
            <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>
              🕐 {o.pickupTime || o.time || '—'} — 👤 {o.userName || String(o.userId || '').slice(0, 6)}
            </div>
            {o.status === 'pending' && (
              <button className="action-btn" style={{ marginTop: 8, width: '100%' }} onClick={() => handleMarkReady(o)}>
                ✅ {store.lang === 'ar' ? 'تجهيز' : 'Mark Ready'}
              </button>
            )}
            {o.status === 'ready' && (
              <button className="action-btn secondary" style={{ marginTop: 8, width: '100%' }} onClick={() => handleMarkPicked(o)}>
                📦 {store.lang === 'ar' ? 'تم الاستلام' : 'Mark Picked Up'}
              </button>
            )}
          </div>
        ))
      )}

      {historyOrders.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 14 }}>✅ {store.lang === 'ar' ? 'السجل' : 'History'}</p>
          {historyOrders.map((o, idx) => (
            <div key={`${o.userId}-${o.id}-${idx}`} style={{
              background: '#fff', borderRadius: 'var(--r-md)', padding: 10,
              boxShadow: '0 0 0 1px rgba(15,10,8,.04), 0 4px 12px rgba(15,10,8,.06)',
              marginBottom: 6, opacity: 0.7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '.82rem' }}>#{String(o.id || '').slice(0, 6)}</span>
                <span style={{ fontSize: '.7rem', color: o.status === 'completed' ? 'var(--green)' : 'var(--red)' }}>
                  {o.status}
                </span>
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)', marginTop: 2 }}>
                🕐 {o.pickupTime || o.time || '—'}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
