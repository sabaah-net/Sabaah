'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../shared/Toast';

export default function PayModal() {
  const { lang, cart, wallet, processPayment } = useAppStore();
  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: { pay: 'الدفع', amount: 'المبلغ المطلوب', wallet: '💰 محفظة', card: '💳 بطاقة', cash: '💵 نقدي', balance: 'الرصيد', insufficient: 'غير كافٍ', confirm: 'تأكيد الدفع', insufficient_wallet: 'الرصيد غير كافٍ', success: 'تم الدفع بنجاح ✅' },
      en: { pay: 'Payment', amount: 'Amount Due', wallet: '💰 Wallet', card: '💳 Card', cash: '💵 Cash', balance: 'Balance', insufficient: 'Insufficient', confirm: 'Confirm Payment', insufficient_wallet: 'Insufficient balance', success: 'Payment successful ✅' },
      zh: { pay: '支付', amount: '应付金额', wallet: '💰 钱包', card: '💳 银行卡', cash: '💵 现金', balance: '余额', insufficient: '不足', confirm: '确认支付', insufficient_wallet: '余额不足', success: '支付成功 ✅' },
      fr: { pay: 'Paiement', amount: 'Montant dû', wallet: '💰 Portefeuille', card: '💳 Carte', cash: '💵 Espèces', balance: 'Solde', insufficient: 'Insuffisant', confirm: 'Confirmer le paiement', insufficient_wallet: 'Solde insuffisant', success: 'Paiement réussi ✅' },
      es: { pay: 'Pago', amount: 'Monto a pagar', wallet: '💰 Billetera', card: '💳 Tarjeta', cash: '💵 Efectivo', balance: 'Saldo', insufficient: 'Insuficiente', confirm: 'Confirmar pago', insufficient_wallet: 'Saldo insuficiente', success: 'Pago exitoso ✅' },
    };
    return dict[lang]?.[key] || dict.ar[key] || key;
  };
  const { show } = useToast();
  const [method, setMethod] = useState<'wallet' | 'card' | 'cash'>('wallet');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handlePay = () => {
    if (method === 'wallet' && wallet < total) {
      show(t('insufficient_wallet'), 'error');
      return;
    }
    processPayment(method);
    show(t('success'), 'success');
    closeModal();
  };

  const closeModal = () => document.getElementById('payModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="payModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal">
        <button className="modal-close" onClick={closeModal}>✕</button>
        <div className="modal-title">{t('pay')}</div>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>{t('amount')}</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--espresso)', margin: '6px 0' }}>{total.toFixed(2)} ⃁</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['wallet', 'card', 'cash'] as const).map((m) => (
            <button
              key={m}
              className={`pay-method ${method === m ? 'active' : ''}`}
              onClick={() => setMethod(m)}
            >
              {t(m)}
            </button>
          ))}
        </div>
        {method === 'wallet' && (
          <div style={{ fontSize: '.82rem', color: wallet >= total ? 'var(--green)' : 'var(--red)', textAlign: 'center', marginBottom: 12 }}>
            {t('balance')}: {wallet.toFixed(2)} ⃁ {wallet >= total ? '✔' : `⚠ ${t('insufficient')}`}
          </div>
        )}
        <button className="action-btn" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handlePay}>
          {t('confirm')}
        </button>
      </div>
    </div>
  );
}
