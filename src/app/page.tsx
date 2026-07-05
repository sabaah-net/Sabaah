'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n';
import { ToastProvider } from '../components/shared/Toast';
import Header from '../components/shared/Header';
import OrderPage from '../components/customer/OrderPage';
import RewardsPage from '../components/customer/RewardsPage';
import WalletPage from '../components/customer/WalletPage';
import HistoryPage from '../components/customer/HistoryPage';
import ProfilePage from '../components/customer/ProfilePage';
import AuthModal from '../components/modals/AuthModal';
import PayModal from '../components/modals/PayModal';
import OrderSuccessModal from '../components/modals/OrderSuccessModal';
import LanguageModal from '../components/modals/LanguageModal';
import VoiceModal from '../components/modals/VoiceModal';
import NotifInbox from '../components/modals/NotifInbox';
import ChatBot from '../components/shared/ChatBot';

const PartnerPortal = dynamic(() => import('../components/partner/PartnerPortal'), { ssr: false });
const AdminShell = dynamic(() => import('../components/admin/AdminShell'), { ssr: false });

type CustomerPage = 'pageOrder' | 'pageRewards' | 'pageWallet' | 'pageHistory' | 'pageProfile';

export default function HomePage() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<CustomerPage>('pageOrder');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const theme = localStorage.getItem('sabaa_theme');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    store.loadFromSupabase();
  }, []);

  useEffect(() => {
    document.documentElement.dir = store.lang === 'ar' ? 'rtl' : 'ltr';
  }, [store.lang]);

  if (!mounted) return null;

  if (store.isLoggedIn && store.role === 'superadmin') {
    return (
      <ToastProvider>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>{t('loading_text', store.lang)}</div>}>
          <AdminShell />
        </Suspense>
      </ToastProvider>
    );
  }

  if (store.isLoggedIn && store.role === 'partner') {
    return (
      <ToastProvider>
        <div className="shell">
          <Header
            onOpenAuth={() => document.getElementById('authModal')?.classList.add('open')}
            onOpenNotif={() => document.getElementById('notifInbox')?.classList.toggle('open')}
            onOpenLang={() => document.getElementById('langModal')?.classList.add('open')}
          />
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>{t('loading_text', store.lang)}</div>}>
            <PartnerPortal />
          </Suspense>
        </div>
        <AuthModal />
        <LanguageModal />
        <NotifInbox />
        <ChatBot />
      </ToastProvider>
    );
  }

  const pages: { id: CustomerPage; icon: string; label: string }[] = [
    { id: 'pageOrder', icon: '☕', label: t('order', store.lang) },
    { id: 'pageRewards', icon: '🏆', label: t('rewards', store.lang) },
    { id: 'pageWallet', icon: '💰', label: t('wallet', store.lang) },
    { id: 'pageHistory', icon: '📋', label: t('history', store.lang) },
    { id: 'pageProfile', icon: '👤', label: t('profile', store.lang) },
  ];

  const pageComponents: Record<CustomerPage, React.ReactNode> = {
    pageOrder: <OrderPage
      onOpenPay={() => document.getElementById('payModal')?.classList.add('open')}
      onOpenVoice={() => document.getElementById('voiceModal')?.classList.add('open')}
    />,
    pageRewards: <RewardsPage />,
    pageWallet: <WalletPage />,
    pageHistory: <HistoryPage />,
    pageProfile: <ProfilePage />,
  };

  return (
    <ToastProvider>
      <div className="shell">
        <div className="offline-banner" id="offlineBanner">{t('offline_banner', store.lang)}</div>
        <Header
          onOpenAuth={() => document.getElementById('authModal')?.classList.add('open')}
          onOpenNotif={() => document.getElementById('notifInbox')?.classList.toggle('open')}
          onOpenLang={() => document.getElementById('langModal')?.classList.add('open')}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {Object.entries(pageComponents).map(([id, component]) => (
              <div key={id} style={{ display: activePage === id ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
                {component}
              </div>
            ))}
          </div>
          <nav className="bottom-nav">
            {pages.map((p) => (
              <button
                key={p.id}
                className={`nav-btn ${activePage === p.id ? 'active' : ''}`}
                onClick={() => setActivePage(p.id)}
              >
                <span className="nav-icon">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <AuthModal />
      <PayModal />
      <OrderSuccessModal />
      <LanguageModal />
      <VoiceModal />
      <NotifInbox />
      <ChatBot />
    </ToastProvider>
  );
}
