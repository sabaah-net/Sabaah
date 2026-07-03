'use client';
import { useAppStore } from '../../store/useAppStore';

export default function RewardsPage() {
  const store = useAppStore();

  const handleRedeem = (id: string) => {
    const reward = store.rewards.find((r) => r.id === id);
    if (!reward || reward.redeemed) return;
    if (!store.currentUser || store.currentUser.points < reward.cost) {
      alert('نقاط غير كافية!');
      return;
    }
  };

  const tierConfig = {
    bronze: { label: '🥉 برونز', curr: 0, next: 500, nextTier: 'فضي' },
    silver: { label: '🥈 فضي', curr: 500, next: 1500, nextTier: 'ذهبي' },
    gold: { label: '🥇 ذهبي', curr: 1500, next: 5000, nextTier: 'بلاتينيوم' },
    platinum: { label: '💎 بلاتينيوم', curr: 5000, next: 10000, nextTier: '💎' },
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
        <div className="loyalty-points">{(store.currentUser?.points || 0).toLocaleString()} نقطة</div>
        <div className="tier-progress">
          <div className="tier-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="tier-next">
          {cfg.next.toLocaleString()} نقطة للوصول إلى {cfg.nextTier} 💎
        </div>
      </div>

      <p className="section-title">🏆 إنجازاتي</p>
      <div className="badge-grid">
        {store.badges.map((b) => (
          <div key={b.id} className={`badge-item ${b.earned ? '' : 'locked'}`} title={b.desc}>
            <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
            <div className="badge-name">{b.name}</div>
          </div>
        ))}
      </div>

      <p className="section-title">🎁 المكافآت المتاحة</p>
      {store.rewards.map((r) => (
        <div key={r.id} className={`reward-card ${r.redeemed ? 'redeemed' : ''}`} onClick={() => handleRedeem(r.id)}>
          <div className="reward-icon">{r.icon}</div>
          <div className="reward-info">
            <div className="reward-title">{r.title}</div>
            <div className="reward-desc">{r.desc}</div>
          </div>
          <div className="reward-cost">{r.redeemed ? '✓ تم' : `${r.cost} نقطة`}</div>
        </div>
      ))}
    </div>
  );
}
