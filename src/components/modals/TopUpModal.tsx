'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../shared/Toast';
import { pushTransaction } from '../../lib/firebase';

const PRESETS = [50, 100, 200, 500];

export default function TopUpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const store = useAppStore();
  const { show } = useToast();
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = document.getElementById('topUpModal');
    if (el) {
      if (isOpen) el.classList.add('open');
      else el.classList.remove('open');
    }
  }, [isOpen]);

  const handleTopUp = async () => {
    if (amount <= 0) { show('Enter an amount', 'error'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    store.setWallet(store.wallet + amount);
    const pid = store.currentUser?.profileId;
    if (pid) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      pushTransaction(pid, {
        title: store.lang === 'ar' ? 'شحن المحفظة' : 'Wallet Top Up',
        titleEn: 'Wallet Top Up',
        amount: amount,
        type: 'credit',
        date: dateStr,
      });
    }
    show(store.lang === 'ar' ? `تم شحن المحفظة بمبلغ ${amount.toFixed(2)} ريال` : `Wallet topped up with ${amount.toFixed(2)} SAR`, 'success');
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" id="topUpModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', left: 18, top: 22 }}>✕</button>
        <div className="modal-title">💳 {store.lang === 'ar' ? 'شحن المحفظة' : 'Top Up Wallet'}</div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginBottom: 4 }}>{store.lang === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--bark)' }}><span className="currency-sym">⃁</span>{store.wallet.toFixed(2)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {PRESETS.map((p) => (
            <button key={p} className={`pay-method ${amount === p ? 'active' : ''}`}
              style={{ padding: '12px', fontSize: '1rem', fontWeight: 800 }}
              onClick={() => setAmount(p)}>
              <span className="currency-sym">⃁</span>{p}
            </button>
          ))}
        </div>

        <input className="coffee-input" type="number" min="1" step="1"
          placeholder={store.lang === 'ar' ? 'مبلغ مخصص' : 'Custom amount'}
          value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />

        <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: '10px 14px', margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem' }}>
          💳 {store.lang === 'ar' ? 'الدفع عبر البطاقة' : 'Card payment'}
        </div>

        <button className="action-btn" style={{ width: '100%', padding: 14, fontSize: '1rem', opacity: loading ? 0.6 : 1 }}
          disabled={loading || amount <= 0} onClick={handleTopUp}>
          {loading ? (store.lang === 'ar' ? 'جاري...' : 'Processing...') : <>💳 {store.lang === 'ar' ? 'شحن' : 'Pay'} <span className="currency-sym">⃁</span>{amount.toFixed(2)}</>}
        </button>
      </div>
    </div>
  );
}
