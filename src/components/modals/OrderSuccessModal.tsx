'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useEffect, useState } from 'react';
import PriceTag from '../shared/PriceTag';

export default function OrderSuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, lastOrder } = useAppStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{
        textAlign: 'center', transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', left: 18, top: 22, fontSize: '1.3rem', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
        <div style={{ fontSize: '3rem', marginBottom: 6, animation: 'scaleIn .4s ease .2s both' }}>🎉</div>
        <div className="modal-title" style={{ fontSize: '1.2rem', animation: 'fadeIn .4s ease .3s both' }}>{t('order_success', lang)}</div>
        {lastOrder && (
          <div style={{ animation: 'slideUp .4s ease .4s both' }}>
            <div style={{
              background: 'var(--cream)', borderRadius: 16, padding: 20, margin: '12px 0',
              border: '2px dashed var(--amber)',
            }}>
              <div style={{ fontSize: '.8rem', color: 'var(--text-light)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('th_pickup_code', lang)}
              </div>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900, fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: 8, color: 'var(--bark)',
              }}>
                {lastOrder.pickupCode}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8, fontSize: '.82rem', color: 'var(--text-light)' }}>
              <span>{t('th_order_no', lang)}: <strong style={{ color: 'var(--bark)' }}>#{lastOrder.id}</strong></span>
              {lastOrder.pickupTime && (
                <span>⏱️ <strong style={{ color: 'var(--bark)' }}>{lastOrder.pickupTime}</strong></span>
              )}
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--text-mid)', marginBottom: 4 }}>
              {lastOrder.cafe} — <PriceTag value={lastOrder.amount} />
            </div>
          </div>
        )}
        <button className="action-btn" style={{ width: '100%', marginTop: 12 }} onClick={onClose}>{t('ok_label', lang)}</button>
      </div>
    </div>
  );
}
