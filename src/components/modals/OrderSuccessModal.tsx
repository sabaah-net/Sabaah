'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function OrderSuccessModal() {
  const { lang, lastOrder } = useAppStore();

  const close = () => document.getElementById('orderSuccessModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="orderSuccessModal" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" style={{ textAlign: 'center' }}>
        <button className="modal-close" onClick={close}>✕</button>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
        <div className="modal-title">{t('order_success', lang)}</div>
        {lastOrder && (
          <>
            <div style={{ background: 'var(--latte)', borderRadius: 12, padding: 16, margin: '12px 0' }}>
              <div style={{ fontSize: '.82rem', color: 'var(--text-light)', marginBottom: 6 }}>{t('th_pickup_code', lang)}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 6 }}>
                {lastOrder.pickupCode}
              </div>
            </div>
            <div style={{ fontSize: '.82rem', color: 'var(--text-light)' }}>
              {t('th_order_no', lang)}: <strong>#{lastOrder.id}</strong>
            </div>
          </>
        )}
        <button className="action-btn" style={{ width: '100%', marginTop: 16 }} onClick={close}>{t('ok_label', lang)}</button>
      </div>
    </div>
  );
}
