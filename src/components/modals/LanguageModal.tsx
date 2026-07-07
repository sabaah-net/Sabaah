'use client';
import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import type { Lang } from '../../types';

export default function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, setLang } = useAppStore();

  useEffect(() => {
    const el = document.getElementById('langModal');
    if (el) {
      if (isOpen) el.classList.add('open');
      else el.classList.remove('open');
    }
  }, [isOpen]);

  const languages: { code: Lang; label: string; dir: string }[] = [
    { code: 'ar', label: t('language_ar', lang), dir: 'rtl' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'es', label: 'Español', dir: 'ltr' },
    { code: 'zh', label: '中文', dir: 'ltr' },
  ];

  const selectLang = (code: Lang) => {
    setLang(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    onClose();
  };

  return (
    <div className="modal-overlay" id="langModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{t('language_select', lang)}</div>
        {languages.map((l) => (
          <button
            key={l.code}
            className={`lang-option ${lang === l.code ? 'active' : ''}`}
            onClick={() => selectLang(l.code)}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {l.code === 'ar' ? '🇸🇦' : l.code === 'en' ? '🇬🇧' : l.code === 'fr' ? '🇫🇷' : l.code === 'es' ? '🇪🇸' : '🇨🇳'}
            </span>
            {l.label}
            {lang === l.code && ' ✓'}
          </button>
        ))}
      </div>
    </div>
  );
}
