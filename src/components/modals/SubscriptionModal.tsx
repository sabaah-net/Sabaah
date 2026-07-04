'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getSubscriptionPlans, getUserSubscription, subscribeUser, cancelSubscription } from '../../lib/supabase';
import { useToast } from '../shared/Toast';

interface Plan { id: string; name_ar: string; name_en: string; price_weekly: number; features: string[]; discount_percent: number; free_delivery: boolean; }
interface UserSub { id: string; plan_id: string; status: string; start_date: string; end_date: string | null; auto_renew: boolean; subscription_plans: Plan; }

export default function SubscriptionModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<UserSub | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: planData } = await getSubscriptionPlans();
      if (planData) setPlans(planData as Plan[]);
      if (store.currentUser?.profileId) {
        const { data: sub } = await getUserSubscription(store.currentUser.profileId);
        if (sub && (sub as any).status === 'active') setCurrentSub(sub as any);
      }
    })();
  }, []);

  const handleSubscribe = async (planId: string, price: number) => {
    if (!store.currentUser?.profileId) { show('Please log in first', 'error'); return; }
    if (store.wallet < price) { show('Insufficient balance', 'error'); return; }
    setLoading(true);
    try {
      await subscribeUser(store.currentUser.profileId, planId);
      store.setWallet(store.wallet - price);
      const { data: sub } = await getUserSubscription(store.currentUser.profileId);
      if (sub && (sub as any).status === 'active') setCurrentSub(sub as any);
      show('Subscribed successfully!', 'success');
    } catch (e: any) {
      show(e.message || 'Subscription failed', 'error');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!store.currentUser?.profileId) return;
    setLoading(true);
    try {
      await cancelSubscription(store.currentUser.profileId);
      setCurrentSub(null);
      show('Subscription cancelled', 'success');
    } catch (e: any) {
      show(e.message || 'Cancel failed', 'error');
    } finally { setLoading(false); }
  };

  const closeModal = () => document.getElementById('subModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="subModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', left: 18, top: 22 }}>✕</button>
        <div className="modal-title">📅 {store.lang === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</div>

        {currentSub && (
          <div style={{ background: 'var(--green-bg)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--green)', fontWeight: 700 }}>✅ {store.lang === 'ar' ? 'مشترك حالياً' : 'Currently Subscribed'}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginTop: 4 }}>
              {store.lang === 'ar' ? currentSub.subscription_plans?.name_ar : (currentSub.subscription_plans?.name_en || currentSub.subscription_plans?.name_ar)}
              {currentSub.auto_renew ? ` — ${store.lang === 'ar' ? 'تجديد تلقائي' : 'Auto-renew'}` : ''}
            </div>
            <button className="action-btn" style={{ width: 'auto', padding: '4px 12px', fontSize: '.7rem', margin: '8px auto 0', background: 'var(--red)', color: '#fff' }}
              disabled={loading} onClick={handleCancel}>
              {store.lang === 'ar' ? 'إلغاء الاشتراك' : 'Cancel'}
            </button>
          </div>
        )}

        {plans.length === 0 && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 24 }}>{store.lang === 'ar' ? 'لا توجد خطط متاحة' : 'No plans available'}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map((plan) => {
            const isActive = currentSub?.plan_id === plan.id;
            return (
              <div key={plan.id} style={{
                background: '#fff', borderRadius: 'var(--r-md)', padding: 16, boxShadow: 'var(--sh-sm)',
                border: isActive ? '2px solid var(--green)' : '1px solid var(--latte)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{store.lang === 'ar' ? plan.name_ar : plan.name_en}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {plan.discount_percent > 0 && <span style={{ fontSize: '.7rem', background: 'var(--green-bg)', color: 'var(--green)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>-{plan.discount_percent}%</span>}
                      {plan.free_delivery && <span style={{ fontSize: '.7rem', background: 'var(--cream)', color: 'var(--amber)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>🚚</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--bark)' }}>{plan.price_weekly.toFixed(2)} ⃁<span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--text-light)' }}>/{store.lang === 'ar' ? 'شهر' : 'mo'}</span></div>
                </div>
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '.8rem', color: 'var(--text-mid)', marginBottom: 12 }}>
                    {plan.features.map((b, i) => (
                      <li key={i} style={{ padding: '3px 0' }}>✓ {b}</li>
                    ))}
                  </ul>
                )}
                <button className="action-btn" style={{ width: '100%', opacity: isActive || loading ? 0.6 : 1 }}
                  disabled={isActive || loading} onClick={() => handleSubscribe(plan.id, plan.price_weekly)}>
                  {isActive ? (store.lang === 'ar' ? 'مفعل' : 'Active') : loading ? (store.lang === 'ar' ? 'جاري...' : 'Processing...') : (store.lang === 'ar' ? 'اشتراك' : 'Subscribe')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
