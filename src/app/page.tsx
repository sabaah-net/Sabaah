'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n';
import { ToastProvider } from '../components/shared/Toast';
import Header from '../components/shared/Header';
import OrderPage from '../components/customer/OrderPage';
import RewardsPage from '../components/customer/RewardsPage';
import WalletPage from '../components/customer/WalletPage';
import HistoryPage from '../components/customer/HistoryPage';
import ProfilePage from '../components/customer/ProfilePage';
import AuthPage from '../components/customer/AuthPage';
import LandingPage from '../components/customer/LandingPage';
import AuthModal from '../components/modals/AuthModal';
import PayModal from '../components/modals/PayModal';
import OrderSuccessModal from '../components/modals/OrderSuccessModal';
import TopUpModal from '../components/modals/TopUpModal';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import LanguageModal from '../components/modals/LanguageModal';
import VoiceModal from '../components/modals/VoiceModal';
import NotifInbox from '../components/modals/NotifInbox';
import ChatBot from '../components/shared/ChatBot';
import { ModalCtx, type ModalState } from '../lib/modal-context';
import { Coffee, Trophy, Wallet, ClipboardList, User } from 'lucide-react';

import PartnerPortal from '../components/partner/PartnerPortal';

type CustomerPage = 'pageOrder' | 'pageRewards' | 'pageWallet' | 'pageHistory' | 'pageProfile';

const pageIcons: Record<CustomerPage, React.ReactNode> = {
  pageOrder: <Coffee size={22} />,
  pageRewards: <Trophy size={22} />,
  pageWallet: <Wallet size={22} />,
  pageHistory: <ClipboardList size={22} />,
  pageProfile: <User size={22} />,
};

export default function HomePage() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<CustomerPage>('pageOrder');
  const [modals, setModals] = useState<ModalState>({
    auth: false, pay: false, topUp: false, subs: false, lang: false, voice: false, notif: false, orderSuccess: false,
  });

  const openModal = (key: keyof ModalState) => setModals((p) => ({ ...p, [key]: true }));
  const closeModal = (key: keyof ModalState) => setModals((p) => ({ ...p, [key]: false }));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const theme = localStorage.getItem('sabaa_theme');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    store.loadFromSupabase();
  }, []);

  useEffect(() => {
    if (store.isLoggedIn && store.role === 'superadmin') {
      store.signOut();
    }
  }, [store.isLoggedIn, store.role]);

  useEffect(() => {
    document.documentElement.dir = store.lang === 'ar' ? 'rtl' : 'ltr';
  }, [store.lang]);

  if (!mounted) return null;

  if (!store.isLoggedIn) {
    return (
      <ToastProvider>
        <LandingPage />
      </ToastProvider>
    );
  }

  if (store.isLoggedIn && store.role === 'partner') {
    return (
      <ToastProvider>
        <ModalCtx.Provider value={{ open: openModal, close: closeModal }}>
          <div className="shell">
            <Header
              onOpenAuth={() => openModal('auth')}
              onOpenNotif={() => openModal('notif')}
              onOpenLang={() => openModal('lang')}
            />
            <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>{t('loading_text', store.lang)}</div>}>
              <PartnerPortal />
            </Suspense>
          </div>
          <AuthModal isOpen={modals.auth} onClose={() => closeModal('auth')} />
          <LanguageModal isOpen={modals.lang} onClose={() => closeModal('lang')} />
          <NotifInbox isOpen={modals.notif} onClose={() => closeModal('notif')} />
          <ChatBot />
        </ModalCtx.Provider>
      </ToastProvider>
    );
  }

  const pages: { id: CustomerPage; label: string }[] = [
    { id: 'pageOrder', label: t('order', store.lang) },
    { id: 'pageRewards', label: t('rewards', store.lang) },
    { id: 'pageWallet', label: t('wallet', store.lang) },
    { id: 'pageHistory', label: t('history', store.lang) },
    { id: 'pageProfile', label: t('profile', store.lang) },
  ];

  const pageComponents: Record<CustomerPage, React.ReactNode> = {
    pageOrder: <OrderPage
      onOpenPay={() => openModal('pay')}
      onOpenVoice={() => openModal('voice')}
    />,
    pageRewards: <RewardsPage />,
    pageWallet: <WalletPage />,
    pageHistory: <HistoryPage />,
    pageProfile: <ProfilePage />,
  };

  return (
    <ToastProvider>
      <ModalCtx.Provider value={{ open: openModal, close: closeModal }}>
        <div className="shell">
          <div className="offline-banner" id="offlineBanner">{t('offline_banner', store.lang)}</div>
          <Header
            onOpenAuth={() => openModal('auth')}
            onOpenNotif={() => openModal('notif')}
            onOpenLang={() => openModal('lang')}
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
                  <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pageIcons[p.id]}
                  </span>
                  <span>{p.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <AuthModal isOpen={modals.auth} onClose={() => closeModal('auth')} />
        <PayModal isOpen={modals.pay} onClose={() => closeModal('pay')} onPaymentSuccess={() => { closeModal('pay'); openModal('orderSuccess'); }} />
        <TopUpModal isOpen={modals.topUp} onClose={() => closeModal('topUp')} />
        <SubscriptionModal isOpen={modals.subs} onClose={() => closeModal('subs')} />
        <LanguageModal isOpen={modals.lang} onClose={() => closeModal('lang')} />
        <VoiceModal isOpen={modals.voice} onClose={() => closeModal('voice')} />
        <NotifInbox isOpen={modals.notif} onClose={() => closeModal('notif')} />
        <OrderSuccessModal isOpen={modals.orderSuccess} onClose={() => closeModal('orderSuccess')} />
        <ChatBot />
      </ModalCtx.Provider>
    </ToastProvider>
  );
}
