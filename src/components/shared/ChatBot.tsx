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
      <button className="chat-fab" onClick={() => setOpen(!open)} style={{ zIndex: 9999 }}>
        {open ? '✕' : '💬'}
      </button>
      <div className={`chat-window ${open ? 'open' : ''}`} style={{ zIndex: 9998, bottom: 160, left: 18, width: 340, maxHeight: 420 }}>
        <div className="chat-header">
          <strong>{t('chat_title', lang)}</strong>
        </div>
        <div className="chat-body">
          {qIndex !== null ? (
            <div style={{ padding: 12 }}>
              <div className="chat-msg bot">{msgs[qIndex].q}</div>
              <div className="chat-msg bot" style={{ background: 'var(--latte)', color: 'var(--text-main)' }}>
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
                <button key={i} className="chat-msg bot" style={{ cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%' }} onClick={() => setQIndex(i)}>
                  {m.q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
