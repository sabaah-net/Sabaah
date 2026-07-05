'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../shared/Toast';

const plans = [
  {
    id: 'daily',
    name: '☕ الباس اليومي',
    nameEn: 'Daily Pass',
    price: 49,
    desc: 'قهوة سوداء واحدة يومياً في أي مقهى شريك',
    descEn: 'One black coffee daily at any partner cafe',
    features: ['7 قهوات', 'توصيل مجاني', 'أولوية التحضير'],
  },
  {
    id: 'milk',
    name: '🥛 محبي الحليب',
    nameEn: 'Milk Lovers',
    price: 69,
    desc: 'قهوة بيضاء أو موكا يومياً',
    descEn: 'White coffee or mocha daily',
    features: ['7 مشروبات', 'حليب نباتي مجاني'],
  },
  {
    id: 'platinum',
    name: '💎 البلاتينيوم',
    nameEn: 'Platinum',
    price: 99,
    desc: 'أي نوع قهوة بلا حدود + حلويات',
    descEn: 'Any coffee unlimited + pastries',
    features: ['غير محدود', 'حلوى مجانية يومياً', 'دعم VIP'],
  },
];

const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function SubscriptionModal() {
  const store = useAppStore();
  const { show } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['الإثنين']);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleActivate = () => {
    if (!store.isLoggedIn) {
      show('يرجى تسجيل الدخول أولاً', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      show('تم تفعيل الاشتراك بنجاح!', 'success');
      closeModal();
    }, 600);
  };

  const closeModal = () => document.getElementById('subModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="subModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">📅 {store.lang === 'ar' ? 'اشتراكات القهوة' : 'Coffee Subscriptions'}</div>

        {plans.map((plan) => {
          const isActive = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`sub-card ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="sub-header">
                <div className="sub-name">{store.lang === 'ar' ? plan.name : plan.nameEn}</div>
                <div className="sub-price">⃁ {plan.price}/{store.lang === 'ar' ? 'أسبوع' : 'wk'}</div>
              </div>
              <div className="sub-desc">{store.lang === 'ar' ? plan.desc : plan.descEn}</div>
              <div className="sub-features">
                {plan.features.map((f, i) => (
                  <span key={i} className="sub-feature">✓ {f}</span>
                ))}
              </div>
            </div>
          );
        })}

        <p className="section-title" style={{ marginTop: 16 }}>📅 {store.lang === 'ar' ? 'جدولة الطلبات' : 'Schedule Orders'}</p>
        <div style={{ fontSize: '.8rem', color: 'var(--text-light)', marginBottom: 8 }}>
          {store.lang === 'ar' ? 'حدد الأيام التي تريد قهوتك فيها:' : 'Select your coffee days:'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {weekDays.map((day) => {
            const isSel = selectedDays.includes(day);
            return (
              <button
                key={day}
                className="action-btn secondary"
                style={{
                  width: 'auto', padding: '6px 12px', fontSize: '.75rem', borderRadius: 20,
                  background: isSel ? 'var(--amber)' : '', color: isSel ? '#fff' : '',
                  borderColor: isSel ? 'var(--amber)' : '',
                }}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <button className="action-btn green-btn" disabled={loading} onClick={handleActivate}>
          {loading ? (store.lang === 'ar' ? 'جاري...' : 'Processing...') : (store.lang === 'ar' ? '✅ تفعيل الاشتراك' : '✅ Activate')}
        </button>
        <button className="action-btn secondary" style={{ marginTop: 8 }} onClick={closeModal}>
          {store.lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
