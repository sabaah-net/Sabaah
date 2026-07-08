"use client";
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { supabase } from '../../lib/supabase';
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
      await supabase.from('contacts').insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message,
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
    { icon: Coffee, title: t('choose_cafe', lang), desc: t('choose_cafe_desc', lang) },
    { icon: Gift, title: t('rewards', lang), desc: t('rewards_desc', lang) },
    { icon: Wallet, title: t('wallet', lang), desc: t('wallet_desc', lang) },
    { icon: Clock, title: t('pickup_time', lang), desc: t('pickup_time_desc', lang) },
  ];

  const benefits = [
    { title: t('benefit1', lang), desc: t('benefit1_desc', lang) },
    { title: t('benefit2', lang), desc: t('benefit2_desc', lang) },
    { title: t('benefit3', lang), desc: t('benefit3_desc', lang) },
    { title: t('benefit4', lang), desc: t('benefit4_desc', lang) },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, var(--bark) 0%, var(--espresso) 50%, #1A0E08 100%)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px', color: '#fff', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', paddingTop: 40, marginBottom: 28 }}>
          <div style={{ margin: '0 auto 16px', width: 72, height: 72, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(192,105,42,.15), 0 8px 32px rgba(192,105,42,.25)' }}>
            <Coffee size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>{t('site_title', lang)}</h1>
          <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{t('site_desc', lang)}</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: 20, marginBottom: 16, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>{t('how_it_works', lang)}</h2>
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14, textAlign: 'center' }}>{t('why_choose_us', lang)}</h2>
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
          {t('sign_up_now', lang)} <ArrowRight size={18} />
        </button>

        <button onClick={() => setShowContact(true)} style={{ width: '100%', padding: '12px 0', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', marginBottom: 20 }}>
          {t('contact_us', lang)}
        </button>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => useAppStore.setState({ lang: 'ar' })} style={{ flex: 1, padding: '10px', background: lang === 'ar' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>🇸🇦 العربية</button>
          <button onClick={() => useAppStore.setState({ lang: 'en' })} style={{ flex: 1, padding: '10px', background: lang === 'en' ? 'var(--amber)' : 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>🇬🇧 English</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 16 }}>
          <p style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.4)' }}>© 2024 {t('site_title', lang)}</p>
        </div>
      </div>

      {showContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) closeContact(); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, direction: lang === 'ar' ? 'rtl' : 'ltr' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A0E08', margin: 0 }}>{t('contact_us', lang)}</h2>
              <button onClick={closeContact} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#666" /></button>
            </div>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Send size={36} color='var(--green)' style={{ marginBottom: 12 }} />
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1A0E08', marginBottom: 4 }}>{t('message_sent', lang)}</p>
                <p style={{ fontSize: '.85rem', color: '#666' }}>{t('we_contact_soon', lang)}</p>
                <button onClick={closeContact} style={{ marginTop: 16, padding: '10px 32px', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{t('ok', lang)}</button>
              </div>
            ) : (
              <>
                <input placeholder={t('full_name', lang) + ' *'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <input placeholder={t('phone_number', lang) + ' *'} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <input placeholder={t('email_placeholder', lang) + ' *'} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '12px 14px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <textarea placeholder={t('your_message', lang) + ' *'} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} style={{ width: '100%', padding: '12px 14px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 10, fontSize: '.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                <button onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '14px 0', background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? .6 : 1 }}>
                  {sending ? t('sending', lang) : t('send', lang)}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
