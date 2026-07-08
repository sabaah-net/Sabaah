"use client";
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { Coffee, Gift, Wallet, Clock, Check, ArrowRight } from 'lucide-react';
import AuthPage from './AuthPage';

export default function LandingPage() {
  const { lang } = useAppStore();
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) return <AuthPage />;

  const features = [
    { icon: Coffee, label: 'choose_cafe', desc: 'choose_cafe_desc', arDesc: 'اختر مقهى قريب من موقعك واستمتع بأشهى أنواع القهوة الطازجة' },
    { icon: Gift, label: 'rewards', desc: 'rewards_desc', arDesc: 'جمع النقاط واحصل على مشروبات مجانية' },
    { icon: Wallet, label: 'wallet', desc: 'wallet_desc', arDesc: 'ادفع بسهولة واختر طريقة الدفع المناسبة لك' },
    { icon: Clock, label: 'pickup_time', desc: 'pickup_time_desc', arDesc: 'احجز موعد الاستلام المناسب لك' },
  ];

  const benefits = [
    { icon: Check, label: 'benefit1', desc: 'benefit1_desc', arDesc: 'أشهى أنواع القهوة من أفضل المقاهي' },
    { icon: Check, label: 'benefit2', desc: 'benefit2_desc', arDesc: 'تجربة طلب سلسة وسريعة' },
    { icon: Check, label: 'benefit3', desc: 'benefit3_desc', arDesc: 'احصل على مكافآت وكل طلب' },
    { icon: Check, label: 'benefit4', desc: 'benefit4_desc', arDesc: 'عرض تفضيلي للأعضاء' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, var(--bark) 0%, var(--espresso) 50%, #1A0E08 100%)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, color: '#fff', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ margin: '0 auto 16px', width: 84, height: 84, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(192,105,42,.15), 0 8px 32px rgba(192,105,42,.25)' }}>
            <Coffee size={48} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 8, lineHeight: 1.1 }}>{t('site_title', lang)}</h1>
          <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>{t('site_desc', lang)}</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: 20, marginBottom: 24, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>{lang === 'ar' ? 'كيف تعمل' : 'How It Works'}</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.88rem', fontWeight: 700, marginBottom: 2 }}>{t(f.label, lang)}</div>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.3 }}>{lang === 'ar' ? f.arDesc : t(f.desc, lang)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: 20, marginBottom: 24, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>{lang === 'ar' ? 'المميزات' : 'Why Choose Us'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                    <Icon size={16} color='var(--green)' style={{ transform: 'translateX(1px)' }} />
                  </div>
                  <div style={{ fontSize: '.78rem', fontWeight: 700 }}>{t(b.label, lang)}</div>
                  <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.2 }}>{lang === 'ar' ? b.arDesc : t(b.desc, lang)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, var(--amber), #B8860B)', borderRadius: '20px', padding: 20, textAlign: 'center', boxShadow: '0 8px 32px rgba(192,105,42,.35)', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 8, color: '#fff' }}>{t('join_community', lang)}</h3>
          <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.9)', marginBottom: 16, lineHeight: 1.5 }}>{lang === 'ar' ? 'انضم إلى آلاف العملاء والاستمتاع بتجربة قهوة لا مثيل لها' : 'Join thousands of customers enjoying the ultimate coffee experience'}</p>
          <button onClick={() => setShowAuth(true)} style={{ all: 'unset', cursor: 'pointer', width: '100%', padding: '14px 0', background: '#fff', color: 'var(--bark)', fontWeight: 900, fontSize: '.95rem', borderRadius: '40px', boxShadow: '0 4px 16px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {t('sign_up_now', lang)} <ArrowRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => useAppStore.setState({ lang: 'ar' })} style={{ flex: 1, padding: '10px', background: lang === 'ar' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: '12px', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'all .2s' }}>{t('language_ar', lang)}</button>
          <button onClick={() => useAppStore.setState({ lang: 'en' })} style={{ flex: 1, padding: '10px', background: lang === 'en' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: '12px', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'all .2s' }}>{t('language_en', lang)}</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 20 }}>
          <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>{t('site_title', lang)}</p>
          <p style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.4)' }}>© 2024 {t('site_title', lang)}</p>
        </div>
      </div>
    </div>
  );
}
