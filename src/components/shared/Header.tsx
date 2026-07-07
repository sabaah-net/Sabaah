'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { Moon, Sun, Globe, Bell, LogIn } from 'lucide-react';

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
          <button className="theme-btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="lang-btn" onClick={onOpenLang} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={14} /> {lang.toUpperCase()}
          </button>
          {!isLoggedIn ? (
            <button className="auth-header-btn" onClick={onOpenAuth} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogIn size={14} /> {t('sign_in', lang)}
            </button>
          ) : (
            <button className="auth-header-btn" style={{ background: 'var(--blue)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onOpenNotif}>
              <Bell size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
