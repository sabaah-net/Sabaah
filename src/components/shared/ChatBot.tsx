'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const faqs: Record<string, { q: string; a: string }[]> = {
  ar: [
    { q: 'كيف أطلب قهوة؟', a: 'اختر المقهى، ثم اختر القهوة، أضف للسلة، ثم ادفع.' },
    { q: 'ما هي طرق الدفع؟', a: 'المحفظة الإلكترونية، البطاقة الائتمانية، أو الدفع النقدي عند الاستلام.' },
    { q: 'كيف أحصل على المكافآت؟', a: 'كل طلب يمنحك نقاط ولاء. استبدلها بمشروبات مجانية!' },
    { q: 'كيف أتواصل مع الدعم؟', a: 'يمكنك مراسلتنا عبر البريد الإلكتروني support@sabaa.coffee' },
  ],
  en: [
    { q: 'How do I order coffee?', a: 'Choose a cafe, pick your coffee, add to cart, and pay.' },
    { q: 'What payment methods?', a: 'E-wallet, credit card, or cash on pickup.' },
    { q: 'How do I earn rewards?', a: 'Every order earns loyalty points. Redeem for free drinks!' },
    { q: 'How to contact support?', a: 'Email us at support@sabaa.coffee' },
  ],
};

export default function ChatBot() {
  const { lang } = useAppStore();
  const [open, setOpen] = useState(false);
  const [qIndex, setQIndex] = useState<number | null>(null);

  const msgs = faqs[lang] || faqs.ar;

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <strong>{lang === 'ar' ? 'المساعد الذكي' : 'Sabaa Assistant'}</strong>
          </div>
          <div className="chatbot-body">
            {qIndex !== null ? (
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{msgs[qIndex].q}</div>
                <div style={{ color: 'var(--text-light)', background: 'var(--foam)', padding: 10, borderRadius: 10 }}>
                  {msgs[qIndex].a}
                </div>
                <button className="action-btn secondary" style={{ margin: '8px auto 0' }} onClick={() => setQIndex(null)}>
                  {lang === 'ar' ? '🔙 رجوع' : '🔙 Back'}
                </button>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                <div style={{ color: 'var(--text-light)', marginBottom: 10 }}>
                  {lang === 'ar' ? 'اختر سؤالاً:' : 'Choose a question:'}
                </div>
                {msgs.map((m, i) => (
                  <button key={i} className="chatbot-q-btn" onClick={() => setQIndex(i)}>
                    {m.q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
