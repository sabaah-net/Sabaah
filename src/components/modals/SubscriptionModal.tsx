'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../shared/Toast';
import { getSubscriptionPlans, subscribeUser } from '../../lib/supabase';
import { pushSubscription } from '../../lib/firebase';

interface Plan {
  id: string; name_ar: string; name_en: string; description_ar: string; description_en: string;
  price_weekly: number; features: string[]; discount_percent: number; free_delivery: boolean;
  days_of_week?: string[];
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekNumber(d: Date): number {
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7);
}

export default function SubscriptionModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await getSubscriptionPlans();
      if (data && data.length > 0) {
        setPlans(data as Plan[]);
        setSelectedPlanId(data[0].id);
      }
      setFetching(false);
      const pid = store.currentUser?.profileId;
      if (pid) {
        const { data: sub } = await import('../../lib/supabase').then(m => m.getUserSubscription(pid));
        if (sub) setActiveSub(sub);
      }
    })();
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleActivate = async () => {
    if (!store.isLoggedIn) { show('يرجى تسجيل الدخول أولاً', 'error'); return; }
    if (!selectedPlanId || !selectedPlan) { show('اختر خطة', 'error'); return; }
    const pid = store.currentUser?.profileId;
    if (!pid) return;

    setLoading(true);
    const result = await subscribeUser(pid, selectedPlanId, selectedPlan.price_weekly);

    if (result.error) {
      show(result.error.message, 'error');
    } else {
      store.setWallet(result.data?.new_balance || store.wallet);
      const now = new Date();
      pushSubscription(pid, {
        plan_id: selectedPlanId,
        plan_name: selectedPlan.name_ar,
        price_weekly: selectedPlan.price_weekly,
        start_date: startDate,
        end_date: formatDate(addDays(now, 7)),
        status: 'active',
        auto_renew: true,
      });
      show('✅ ' + (store.lang === 'ar' ? 'تم تفعيل الاشتراك بنجاح! سيتم تجديده أسبوعياً' : 'Subscription activated! Weekly renewal'), 'success');
      closeModal();
    }
    setLoading(false);
  };

  const closeModal = () => document.getElementById('subModal')?.classList.remove('open');

  const startDateTime = new Date(startDate);
  const endDateTime = addDays(startDateTime, 7);
  const todayStr = formatDate(new Date());
  const remainingMs = startDateTime.getTime() - new Date(todayStr).getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="modal-overlay" id="subModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">📅 {store.lang === 'ar' ? 'اشتراكات القهوة الأسبوعية' : 'Weekly Coffee Subs'}</div>

        {activeSub && (
          <div style={{
            background: 'var(--green-bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px',
            marginBottom: 12, border: '1px solid var(--green)', fontSize: '.78rem',
          }}>
            {store.lang === 'ar' ? '✅ لديك اشتراك نشط حالياً' : '✅ You have an active subscription'}
          </div>
        )}

        {fetching && <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)' }}>{store.lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>}

        {!fetching && plans.length === 0 && (
          <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-light)' }}>
            {store.lang === 'ar' ? 'لا توجد خطط اشتراك متاحة حالياً' : 'No subscription plans available'}
          </p>
        )}

        {!fetching && plans.map((plan) => {
          const isActive = selectedPlanId === plan.id;
          const name = store.lang === 'ar' ? plan.name_ar : (plan.name_en || plan.name_ar);
          return (
            <div key={plan.id}
              className={`sub-card ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedPlanId(plan.id)}>
              <div className="sub-header">
                <div className="sub-name">{name}</div>
                <div className="sub-price">⃁ {plan.price_weekly}/{store.lang === 'ar' ? 'أسبوع' : 'wk'}</div>
              </div>
              <div className="sub-desc">{store.lang === 'ar' ? plan.description_ar : (plan.description_en || '')}</div>
              {plan.discount_percent > 0 && <div style={{ fontSize: '.7rem', color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>-{plan.discount_percent}% {store.lang === 'ar' ? 'خصم' : 'discount'}</div>}
              <div className="sub-features">
                {Array.isArray(plan.features) && plan.features.map((f, i) => (
                  <span key={i} className="sub-feature">✓ {f}</span>
                ))}
              </div>
            </div>
          );
        })}

        {selectedPlan && (
          <>
            <p className="section-title" style={{ marginTop: 16 }}>📅 {store.lang === 'ar' ? 'جدولة الاشتراك' : 'Schedule Subscription'}</p>
            <div style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: 4 }}>
              {store.lang === 'ar' ? 'تاريخ البدء:' : 'Start date:'}
            </div>
            <input type="date" className="coffee-input" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={formatDate(new Date())} style={{ marginBottom: 12 }} />

            <div style={{
              background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: '12px 14px',
              marginBottom: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginBottom: 4 }}>
                {store.lang === 'ar' ? 'ملخص الاشتراك' : 'Subscription Summary'}
              </div>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>
                {store.lang === 'ar' ? `🗓️ أسبوع واحد • ${getWeekNumber(startDateTime)} - ${getWeekNumber(endDateTime)}` : `🗓️ 1 week • Week ${getWeekNumber(startDateTime)} - ${getWeekNumber(endDateTime)}`}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-mid)', marginTop: 2 }}>
                {formatDate(startDateTime)} → {formatDate(endDateTime)}
              </div>
              <div style={{ fontSize: '.95rem', fontWeight: 900, color: 'var(--bark)', marginTop: 6 }}>
                ⃁ {selectedPlan.price_weekly}/{store.lang === 'ar' ? 'أسبوع' : 'week'}
                <span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-light)', display: 'block' }}>
                  {store.lang === 'ar' ? '🔄 سيتم تجديده تلقائياً كل أسبوع' : '🔄 Auto-renews every week'}
                </span>
              </div>
            </div>
          </>
        )}

        <button className="action-btn green-btn" disabled={loading || fetching || !selectedPlan} onClick={handleActivate} style={{ marginTop: 8 }}>
          {loading ? (store.lang === 'ar' ? 'جاري...' : 'Processing...') : (store.lang === 'ar' ? '✅ تفعيل الاشتراك (أسبوعي)' : '✅ Activate Weekly')}
        </button>
        <button className="action-btn secondary" style={{ marginTop: 8 }} onClick={closeModal}>
          {store.lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
