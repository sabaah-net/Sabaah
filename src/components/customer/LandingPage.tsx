"use client";
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Coffee, Gift, Wallet, Clock, Check, X, Send, ArrowRight } from 'lucide-react';
import AuthPage from './AuthPage';

export default function LandingPage() {
  const { lang } = useAppStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (showAuth) return <AuthPage />;

  const handleSend = async () => {
    if (!form.name || !form.phone || !form.email || !form.message) return;
    setSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {} finally {
      setSending(false);
    }
  };

  const closeContact = () => {
    setShowContact(false);
    setSent(false);
    setForm({ name: '', phone: '', email: '', message: '' });
  };

  const features = [
    { icon: Coffee, title: lang === 'ar' ? 'اختر المقهى' : 'Choose a Cafe', desc: lang === 'ar' ? 'اختر مقهى قريب من موقعك واستمتع بأشهى أنواع القهوة الطازجة' : 'Find a cafe near you and browse their menu' },
    { icon: Gift, title: lang === 'ar' ? 'المكافآت' : 'Rewards', desc: lang === 'ar' ? 'جمع النقاط واحصل على مشروبات مجانية' : 'Earn points and get free drinks' },
    { icon: Wallet, title: lang === 'ar' ? 'المحفظة' : 'Wallet', desc: lang === 'ar' ? 'ادفع بسهولة واختر طريقة الدفع المناسبة لك' : 'Pay easily with your preferred method' },
    { icon: Clock, title: lang === 'ar' ? 'وقت الاستلام' : 'Pickup Time', desc: lang === 'ar' ? 'احجز موعد الاستلام المناسب لك' : 'Schedule your pickup at the perfect time' },
  ];

  const benefits = [
    { title: lang === 'ar' ? 'قهوة مختارة بعناية' : 'Carefully Selected Coffee', desc: lang === 'ar' ? 'أشهى أنواع القهوة من أفضل المقاهي' : 'The finest coffee from the best cafes' },
    { title: lang === 'ar' ? 'تجربة سلسة' : 'Seamless Experience', desc: lang === 'ar' ? 'تجربة طلب سلسة وسريعة' : 'Fast and smooth ordering experience' },
    { title: lang === 'ar' ? 'مكافآت يومية' : 'Daily Rewards', desc: lang === 'ar' ? 'احصل على مكافآت مع كل طلب' : 'Get rewards with every order' },
    { title: lang === 'ar' ? 'عروض حصرية' : 'Exclusive Offers', desc: lang === 'ar' ? 'عروض تفضيلية للأعضاء' : 'Exclusive member-only offers' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, var(--bark) 0%, var(--espresso) 50%, #1A0E08 100%)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px', color: '#fff', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', paddingTop: 40, marginBottom: 28 }}>
          <div style={{ margin: '0 auto 16px', width: 72, height: 72, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(192,105,42,.15), 0 8px 32px rgba(192,105,42,.25)' }}>
            <Coffee size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>{lang === 'ar' ? 'سبعة ٧ — صباح' : 'Sabaa 7 — Sabaah'}</h1>
          <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{lang === 'ar' ? 'منصة القهوة السعودية — اطلب قهوتك المفضلة من أفضل المقاهي' : 'The Saudi coffee platform — order from the best cafes'}</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: 20, marginBottom: 16, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>{lang === 'ar' ? 'كيف تعمل' : 'How It Works'}</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)' }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: 20, marginBottom: 20, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>{lang === 'ar' ? 'لماذا نحن' : 'Why Choose Us'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '12px 8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Check size={14} color='var(--green)' />
                </div>
                <div style={{ fontSize: '.75rem', fontWeight: 700 }}>{b.title}</div>
                <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.7)' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setShowAuth(true)} style={{ width: '100%', padding: '14px 0', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: '1rem', cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(192,105,42,.35)' }}>
          {lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up Now'} <ArrowRight size={18} />
        </button>

        <button onClick={() => setShowContact(true)} style={{ width: '100%', padding: '12px 0', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', marginBottom: 20 }}>
          {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
        </button>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => useAppStore.setState({ lang: 'ar' })} style={{ flex: 1, padding: '10px', background: lang === 'ar' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>🇸🇦 العربية</button>
          <button onClick={() => useAppStore.setState({ lang: 'en' })} style={{ flex: 1, padding: '10px', background: lang === 'en' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>🇬🇧 English</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 16 }}>
          <p style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.4)' }}>© 2024 {lang === 'ar' ? 'سبعة ٧ — صباح' : 'Sabaa 7 — Sabaah'}</p>
        </div>
      </div>

      {showContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeContact(); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, direction: lang === 'ar' ? 'rtl' : 'ltr' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A0E08', margin: 0 }}>{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h2>
              <button onClick={closeContact} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#666" /></button>
            </div>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Send size={36} color='var(--green)' style={{ marginBottom: 12 }} />
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1A0E08', marginBottom: 4 }}>{lang === 'ar' ? 'تم إرسال رسالتك!' : 'Message sent!'}</p>
                <p style={{ fontSize: '.85rem', color: '#666' }}>{lang === 'ar' ? 'سنتواصل معك قريباً' : 'We will get back to you soon'}</p>
                <button onClick={closeContact} style={{ marginTop: 16, padding: '10px 32px', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{lang === 'ar' ? 'حسناً' : 'OK'}</button>
              </div>
            ) : (
              <>
                <input placeholder={lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <input placeholder={lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <input placeholder={lang === 'ar' ? 'البريد الإلكتروني *' : 'Email *'} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <textarea placeholder={lang === 'ar' ? 'الرسالة *' : 'Message *'} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} style={{ width: '100%', padding: '12px 14px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                <button onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '14px 0', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? .6 : 1 }}>
                  {sending ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال' : 'Send')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
