'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import SubscriptionModal from '../modals/SubscriptionModal';
import TopUpModal from '../modals/TopUpModal';

export default function WalletPage() {
  const store = useAppStore();

  const openSubs = () => document.getElementById('subModal')?.classList.add('open');
  const openTopUp = () => document.getElementById('topUpModal')?.classList.add('open');

  return (
    <div id="pageWallet">
      <SubscriptionModal />
      <TopUpModal />
      <div className="wallet-hero">
        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>
          {t('wallet_balance_label', store.lang)}
        </div>
        <div className="wallet-balance">{store.wallet.toFixed(2)}</div>
        <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{t('sar_label', store.lang)} ⃁</div>
        <div className="wallet-actions">
          <button className="wallet-action-btn" onClick={openTopUp}>{t('topup_btn', store.lang)}</button>
          <button className="wallet-action-btn" onClick={openSubs}>{t('subscriptions', store.lang)}</button>
        </div>
      </div>

      <p className="section-title">{t('recent_transactions', store.lang)}</p>
      <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)' }}>
        {store.transactions.map((tx, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--latte)' }}>
            <div>
              <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{store.lang === 'ar' ? tx.title : tx.titleEn}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--text-light)' }}>{tx.date}</div>
            </div>
            <div style={{ fontSize: '.88rem', fontWeight: 900, color: tx.type === 'credit' ? 'var(--green)' : 'var(--red)' }}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} ⃁
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
