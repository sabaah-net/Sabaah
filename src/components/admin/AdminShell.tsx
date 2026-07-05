'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import AdminDashboard from './AdminDashboard';
import AdminLiveOps from './AdminLiveOps';
import AdminPartners from './AdminPartners';
import AdminMenus from './AdminMenus';
import AdminUsers from './AdminUsers';
import AdminFinancials from './AdminFinancials';
import AdminAnalytics from './AdminAnalytics';
import AdminNotifications from './AdminNotifications';
import AdminAudit from './AdminAudit';
import AdminSettings from './AdminSettings';
import AdminReports from './AdminReports';
import AdminApprovals from './AdminApprovals';
import AdminSubscriptions from './AdminSubscriptions';
import AdminPermissions from './AdminPermissions';
import AdminSuppliers from './AdminSuppliers';
import AdminComplaints from './AdminComplaints';

type AdminPage = 'apDashboard' | 'apLiveOps' | 'apPartners' | 'apMenus' | 'apUsers' | 'apFinancials' | 'apAnalytics' | 'apReports' | 'apNotifications' | 'apAudit' | 'apSettings' | 'apApprovals' | 'apSubscriptions' | 'apPermissions' | 'apSuppliers' | 'apComplaints';

export default function AdminShell() {
  const [page, setPage] = useState<AdminPage>('apDashboard');
  const { signOut, lang, loadFromSupabase } = useAppStore();

  const navItems: { id: AdminPage; icon: string; labelKey: string; sectionKey?: string }[] = [
    { id: 'apDashboard', icon: '📊', labelKey: 'admin_dashboard', sectionKey: 'main_section' },
    { id: 'apLiveOps', icon: '🚨', labelKey: 'admin_live_ops' },
    { id: 'apPartners', icon: '🏪', labelKey: 'admin_partners', sectionKey: 'management_section' },
    { id: 'apMenus', icon: '☕', labelKey: 'admin_menus' },
    { id: 'apApprovals', icon: '✅', labelKey: 'admin_approvals' },
    { id: 'apSubscriptions', icon: '📅', labelKey: 'admin_subscriptions' },
    { id: 'apUsers', icon: '👥', labelKey: 'admin_users' },
    { id: 'apPermissions', icon: '🔐', labelKey: 'Permissions' },
    { id: 'apFinancials', icon: '💰', labelKey: 'admin_financials', sectionKey: 'finance_section' },
    { id: 'apAnalytics', icon: '📈', labelKey: 'admin_analytics' },
    { id: 'apReports', icon: '📄', labelKey: 'admin_reports' },
    { id: 'apNotifications', icon: '🔔', labelKey: 'admin_notifications', sectionKey: 'security_section' },
    { id: 'apSuppliers', icon: '🚚', labelKey: 'admin_suppliers' },
    { id: 'apComplaints', icon: '⚠️', labelKey: 'admin_complaints' },
    { id: 'apAudit', icon: '📋', labelKey: 'admin_audit' },
    { id: 'apSettings', icon: '⚙️', labelKey: 'admin_settings' },
  ];

  let lastSection = '';
  const pageTitles: Record<AdminPage, string> = {
    apDashboard: t('admin_dashboard', lang), apLiveOps: t('admin_live_ops', lang),
    apPartners: t('admin_partners', lang), apMenus: t('admin_menus', lang),
    apApprovals: '✅ Approvals', apSubscriptions: '📅 Subscriptions', apUsers: t('admin_users', lang),
    apPermissions: '🔐 Permissions',
    apFinancials: t('admin_financials', lang), apAnalytics: t('admin_analytics', lang),
    apReports: t('admin_reports', lang), apNotifications: t('admin_notifications', lang),
    apSuppliers: t('admin_suppliers', lang) || '🚚 Suppliers',
    apComplaints: t('admin_complaints', lang) || '⚠️ Complaints',
    apAudit: t('admin_audit', lang), apSettings: t('admin_settings', lang),
  };

  return (
    <div className="admin-shell show">
      <nav className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-mark">{t('admin_logo', lang)}</div>
          <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>
            {t('power_admin', lang)}
          </div>
          <div className="admin-role-badge">{t('role_super_admin', lang)}</div>
        </div>
        <div className="admin-nav">
          {navItems.map((item) => {
            const showSection = item.sectionKey && t(item.sectionKey, lang) !== lastSection;
            if (item.sectionKey) lastSection = t(item.sectionKey, lang);
            return (
              <div key={item.id}>
                {item.sectionKey && <div className="admin-nav-section">{t(item.sectionKey, lang)}</div>}
                <div className={`admin-nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                  <span>{item.icon}</span> {item.labelKey === 'Permissions' ? 'Permissions' : t(item.labelKey, lang)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="admin-bottom">
          <button className="action-btn secondary" style={{ fontSize: '.75rem', padding: 7 }} onClick={signOut}>{t('logout_label', lang)}</button>
        </div>
      </nav>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">{pageTitles[page]}</div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', background: 'var(--foam)', padding: '4px 10px', borderRadius: 20 }}>
              <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
              {t('system_online', lang)}
            </div>
            <select className="coffee-input" style={{ width: 'auto', margin: 0, padding: '4px 8px', fontSize: '.75rem' }}
              value={lang} onChange={(e) => useAppStore.getState().setLang(e.target.value as any)}>
              <option value="ar">🇸🇦 AR</option>
              <option value="en">🇬🇧 EN</option>
              <option value="zh">🇨🇳 ZH</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="es">🇪🇸 ES</option>
            </select>
            <button className="action-btn secondary" style={{ width: 'auto', padding: '7px 16px', fontSize: '.8rem', margin: 0 }} onClick={() => loadFromSupabase()}>{t('refresh', lang)}</button>
            <button className="action-btn secondary" style={{ width: 'auto', padding: '7px 16px', fontSize: '.8rem', margin: 0 }} onClick={() => setPage('apReports')}>{t('export', lang)}</button>
          </div>
        </div>

        <div className="admin-content">
          {page === 'apDashboard' && <AdminDashboard />}
          {page === 'apLiveOps' && <AdminLiveOps />}
          {page === 'apPartners' && <AdminPartners />}
          {page === 'apMenus' && <AdminMenus />}
          {page === 'apApprovals' && <AdminApprovals />}
          {page === 'apSubscriptions' && <AdminSubscriptions />}
          {page === 'apUsers' && <AdminUsers />}
          {page === 'apPermissions' && <AdminPermissions />}
          {page === 'apFinancials' && <AdminFinancials />}
          {page === 'apAnalytics' && <AdminAnalytics />}
          {page === 'apNotifications' && <AdminNotifications />}
          {page === 'apSuppliers' && <AdminSuppliers />}
          {page === 'apComplaints' && <AdminComplaints />}
          {page === 'apAudit' && <AdminAudit />}
          {page === 'apSettings' && <AdminSettings />}
          {page === 'apReports' && <AdminReports />}
        </div>
      </div>
    </div>
  );
}
