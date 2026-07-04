'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function RewardsPage() {
  const store = useAppStore();

  const handleRedeem = (id: string) => {
    const reward = store.rewards.find((r) => r.id === id);
    if (!reward || reward.redeemed) return;
    if (!store.currentUser || store.currentUser.points < reward.cost) {
      alert(t('points_insufficient', store.lang));
      return;
    }
  };

  const tierConfig = {
    bronze: { label: t('tier_bronze', store.lang), curr: 0, next: 500, nextTier: 'فضي' },
    silver: { label: t('tier_silver', store.lang), curr: 500, next: 1500, nextTier: 'ذهبي' },
    gold: { label: t('tier_gold', store.lang), curr: 1500, next: 5000, nextTier: 'بلاتينيوم' },
    platinum: { label: t('tier_platinum', store.lang), curr: 5000, next: 10000, nextTier: '💎' },
  };
  const tier = store.currentUser?.tier || 'bronze';
  const cfg = tierConfig[tier];
  const progress = cfg.next > cfg.curr
    ? Math.min(100, ((store.currentUser?.points || 0) - cfg.curr) / (cfg.next - cfg.curr) * 100)
    : 100;

  return (
    <div id="pageRewards">
      <div className="loyalty-hero">
        <div className="loyalty-tier">{cfg.label}</div>
        <div className="loyalty-points">{(store.currentUser?.points || 0).toLocaleString('en-US')} {t('points_label', store.lang)}</div>
        <div className="tier-progress">
          <div className="tier-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="tier-next">
          {cfg.next.toLocaleString('en-US')} {t('points_to_next', store.lang)} {cfg.nextTier} 💎
        </div>
      </div>

      <p className="section-title">{t('achievements', store.lang)}</p>
      <div className="badge-grid">
        {store.badges.map((b) => (
          <div key={b.id} className={`badge-item ${b.earned ? '' : 'locked'}`} title={b.desc}>
            <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
            <div className="badge-name">{b.name}</div>
          </div>
        ))}
      </div>

      <p className="section-title">{t('rewards_available', store.lang)}</p>
      {store.rewards.map((r) => (
        <div key={r.id} className={`reward-card ${r.redeemed ? 'redeemed' : ''}`} onClick={() => handleRedeem(r.id)}>
          <div className="reward-icon">{r.icon}</div>
          <div className="reward-info">
            <div className="reward-title">{r.title}</div>
            <div className="reward-desc">{r.desc}</div>
          </div>
            <div className="reward-cost">{r.redeemed ? t('redeemed_label', store.lang) : `${r.cost} ${t('points_label', store.lang)}`}</div>
        </div>
      ))}
    </div>
  );
}
