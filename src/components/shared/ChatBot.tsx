'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import type { Lang } from '../../types';

const getFaqs = (lang: Lang) => [
  { q: t('faq_how_order_q', lang), a: t('faq_how_order_a', lang) },
  { q: t('faq_payment_q', lang), a: t('faq_payment_a', lang) },
  { q: t('faq_rewards_q', lang), a: t('faq_rewards_a', lang) },
  { q: t('faq_support_q', lang), a: t('faq_support_a', lang) },
];

export default function ChatBot() {
  const { lang } = useAppStore();
  const [open, setOpen] = useState(false);
  const [qIndex, setQIndex] = useState<number | null>(null);

  const msgs = getFaqs(lang);

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <strong>{t('chat_title', lang)}</strong>
          </div>
          <div className="chatbot-body">
            {qIndex !== null ? (
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{msgs[qIndex].q}</div>
                <div style={{ color: 'var(--text-light)', background: 'var(--foam)', padding: 10, borderRadius: 10 }}>
                  {msgs[qIndex].a}
                </div>
                <button className="action-btn secondary" style={{ margin: '8px auto 0' }} onClick={() => setQIndex(null)}>
                  {t('chat_back', lang)}
                </button>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                <div style={{ color: 'var(--text-light)', marginBottom: 10 }}>
                  {t('chat_ask', lang)}
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
