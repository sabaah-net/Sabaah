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

  const defaultBadges = [
    { id: '1', icon: '☕', name: store.lang === 'ar' ? 'أول طلب' : 'First Order', desc: store.lang === 'ar' ? 'قم بطلبك الأول' : 'Place your first order', earned: false },
    { id: '2', icon: '⭐', name: store.lang === 'ar' ? 'خمس طلبات' : '5 Orders', desc: store.lang === 'ar' ? 'أكمل 5 طلبات' : 'Complete 5 orders', earned: false },
    { id: '3', icon: '🔥', name: store.lang === 'ar' ? 'عشرة طلبات' : '10 Orders', desc: store.lang === 'ar' ? 'أكمل 10 طلبات' : 'Complete 10 orders', earned: false },
    { id: '4', icon: '💎', name: store.lang === 'ar' ? 'العميل المخلص' : 'Loyal Customer', desc: store.lang === 'ar' ? 'أكمل 25 طلبًا' : 'Complete 25 orders', earned: false },
    { id: '5', icon: '🎉', name: store.lang === 'ar' ? 'المؤسس' : 'Founder', desc: store.lang === 'ar' ? 'انضم مبكرًا' : 'Joined early', earned: true },
  ];
  const defaultRewards = [
    { id: '1', icon: '🎁', title: store.lang === 'ar' ? 'قهوة مجانية' : 'Free Coffee', desc: store.lang === 'ar' ? 'احصل على قهوة مجانية عند تجميع 500 نقطة' : 'Get a free coffee when you collect 500 points', cost: 500, redeemed: false },
    { id: '2', icon: '🧁', title: store.lang === 'ar' ? 'معجنات مجانية' : 'Free Pastry', desc: store.lang === 'ar' ? 'احصل على معجنات مجانية عند تجميع 300 نقطة' : 'Get a free pastry when you collect 300 points', cost: 300, redeemed: false },
    { id: '3', icon: '🏆', title: store.lang === 'ar' ? 'خصم ١٠٪' : '10% Discount', desc: store.lang === 'ar' ? 'خصم 10% على طلبك القادم' : '10% off your next order', cost: 200, redeemed: false },
  ];

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
        {(store.badges.length > 0 ? store.badges : defaultBadges).map((b) => (
          <div key={b.id} className={`badge-item ${b.earned ? '' : 'locked'}`} title={b.desc}>
            <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
            <div className="badge-name">{b.name}</div>
          </div>
        ))}
      </div>

      <p className="section-title">{t('rewards_available', store.lang)}</p>
      {(store.rewards.length > 0 ? store.rewards : defaultRewards).map((r) => (
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