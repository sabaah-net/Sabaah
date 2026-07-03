'use client';
import { useAppStore } from '../../store/useAppStore';
import type { Lang } from '../../types';

const languages: { code: Lang; label: string; dir: string }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'zh', label: '中文', dir: 'ltr' },
];

export default function LanguageModal() {
  const { lang, setLang } = useAppStore();

  const selectLang = (code: Lang) => {
    setLang(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    close();
  };

  const close = () => document.getElementById('langModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="langModal" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <button className="modal-close" onClick={close}>✕</button>
        <div className="modal-title">اختيار اللغة</div>
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
