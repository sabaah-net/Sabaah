'use client';
import { useAppStore } from '../../store/useAppStore';

export default function WalletPage() {
  const store = useAppStore();

  return (
    <div id="pageWallet">
      <div className="wallet-hero">
        <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>
          رصيد المحفظة
        </div>
        <div className="wallet-balance">{store.wallet.toFixed(2)}</div>
        <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>ريال سعودي ⃁</div>
        <div className="wallet-actions">
          <button className="wallet-action-btn" onClick={() => {
            store.setWallet(store.wallet + 50);
          }}>💳 شحن الرصيد</button>
          <button className="wallet-action-btn">📅 الاشتراكات</button>
        </div>
      </div>

      <p className="section-title">📋 المعاملات الأخيرة</p>
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
