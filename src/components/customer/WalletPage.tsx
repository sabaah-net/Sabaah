'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useModal } from '../../lib/modal-context';

export default function WalletPage() {
  const store = useAppStore();
  const { open } = useModal();
  const openSubs = () => open('subs');
  const openTopUp = () => open('topUp');

  return (
    <div id="pageWallet" style={{ paddingTop: 10 }}>
      <div className="wallet-hero">
        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>
          {t('wallet_balance_label', store.lang)}
        </div>
        <div className="wallet-balance"><span className="currency-sym">⃁</span>{store.wallet.toFixed(2)}</div>
        <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}><span className="currency-sym">⃁</span></div>
        <div className="wallet-actions">
          <button className="wallet-action-btn" onClick={openTopUp}>{t('topup_btn', store.lang)}</button>
          <button className="wallet-action-btn" onClick={openSubs}>{t('subscriptions', store.lang)}</button>
        </div>
      </div>

      <p className="section-title">{t('recent_transactions', store.lang)}</p>
      <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)' }}>
        {store.transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-light)', fontSize: '.85rem' }}>
            {store.lang === 'ar' ? 'لا توجد معاملات' : 'No transactions'}
          </div>
        )}
        {store.transactions.map((tx, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < store.transactions.length - 1 ? '1px solid var(--latte)' : 'none' }}>
            <div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{store.lang === 'ar' ? tx.title : tx.titleEn}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--text-light)' }}>{tx.date}</div>
            </div>
            <div style={{ fontSize: '.88rem', fontWeight: 900, color: tx.type === 'credit' ? 'var(--green)' : 'var(--red)' }}>
              {tx.type === 'credit' ? '+' : ''}<span className="currency-sym">⃁</span>{tx.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
