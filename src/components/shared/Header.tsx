'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useToast } from './Toast';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenNotif: () => void;
  onOpenLang: () => void;
}

export default function Header({ onOpenAuth, onOpenNotif, onOpenLang }: HeaderProps) {
  const { lang, isLoggedIn, currentUser, theme, toggleTheme } = useAppStore();

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <div className="logo-arabic">سبعة <span className="logo-num">٧</span></div>
          <div className="logo-sub" id="logoSub">
            {t('greeting_default', lang)}
          </div>
        </div>
        <div className="header-right">
          <button className="theme-btn" onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className="lang-btn" onClick={onOpenLang}>🌐 {lang.toUpperCase()}</button>
          {!isLoggedIn ? (
            <button className="auth-header-btn" onClick={onOpenAuth}>{t('sign_in', lang)}</button>
          ) : (
            <button className="auth-header-btn" style={{ background: 'var(--blue)', position: 'relative' }} onClick={onOpenNotif}>
              🔔
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
