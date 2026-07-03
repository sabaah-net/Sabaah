'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function AdminUsers() {
  const { users, lang } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const statusLabel: Record<string, string> = { active: t('active', lang), suspended: t('suspended', lang), banned: t('banned', lang) };

  return (
    <div className="admin-page" id="apUsers">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('user_management', lang)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="admin-search" placeholder={t('search_users', lang)} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>{t('name', lang)}</th><th>{t('phone', lang)}</th><th>{t('email', lang)}</th><th>{t('role', lang)}</th><th>{t('status', lang)}</th><th>{t('wallet_col', lang)}</th><th>{t('last_login', lang)}</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{t('no_results', lang)}</td></tr>
            )}
            {filtered.map((u, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><strong>{u.name}</strong></td>
                <td dir="ltr" style={{ fontSize: '.82rem' }}>{u.phone || '-'}</td>
                <td>{u.email}</td>
                <td><span className={`table-badge badge-${u.role === 'Partner' ? 'blue' : u.role === 'Super Admin' ? 'amber' : 'green'}`}>{u.role}</span></td>
                <td><span className={`table-badge badge-${u.status === 'active' ? 'green' : 'red'}`}>{statusLabel[u.status] || u.status}</span></td>
                <td>{(u.wallet || 0).toFixed(2)} ⃁</td>
                <td style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{u.lastLogin || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}