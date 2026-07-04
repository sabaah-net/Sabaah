'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getSubscriptionPlans, getUserSubscription, subscribeUser } from '../../lib/supabase';
import { useToast } from '../shared/Toast';

interface Plan { id: string; name: string; name_en: string; price: number; benefits: string[]; }

export default function SubscriptionModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await getSubscriptionPlans();
      if (data) setPlans(data as Plan[]);
      if (store.currentUser?.profileId) {
        const { data: sub } = await getUserSubscription(store.currentUser.profileId);
        if (sub) setCurrentPlan((sub as any).plan_id);
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
      setCurrentPlan(planId);
      show('Subscribed successfully!', 'success');
    } catch (e: any) {
      show(e.message || 'Subscription failed', 'error');
    } finally { setLoading(false); }
  };

  const closeModal = () => document.getElementById('subModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="subModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', left: 18, top: 22 }}>✕</button>
        <div className="modal-title">📅 {store.lang === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</div>

        {currentPlan && (
          <div style={{ background: 'var(--green-bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 14, textAlign: 'center', fontSize: '.82rem', color: 'var(--green)', fontWeight: 700 }}>
            ✅ {store.lang === 'ar' ? 'مشترك حالياً' : 'Currently Subscribed'}
          </div>
        )}

        {plans.length === 0 && (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 24 }}>{store.lang === 'ar' ? 'لا توجد خطط متاحة' : 'No plans available'}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map((plan) => {
            const isActive = currentPlan === plan.id;
            return (
              <div key={plan.id} style={{
                background: '#fff', borderRadius: 'var(--r-md)', padding: 16, boxShadow: 'var(--sh-sm)',
                border: isActive ? '2px solid var(--green)' : '1px solid var(--latte)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{store.lang === 'ar' ? plan.name : plan.name_en}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--bark)' }}>{plan.price.toFixed(2)} ⃁<span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--text-light)' }}>/{store.lang === 'ar' ? 'شهر' : 'mo'}</span></div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '.8rem', color: 'var(--text-mid)', marginBottom: 12 }}>
                  {plan.benefits?.map((b, i) => (
                    <li key={i} style={{ padding: '3px 0' }}>✓ {b}</li>
                  ))}
                </ul>
                <button className="action-btn" style={{ width: '100%', opacity: isActive || loading ? 0.6 : 1 }}
                  disabled={isActive || loading} onClick={() => handleSubscribe(plan.id, plan.price)}>
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
