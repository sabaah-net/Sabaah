'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getSystemSettings, updateSystemSetting, addAuditLog, clearAllOrders } from '../../lib/supabase';
import { useToast } from '../shared/Toast';
import { t } from '../../i18n';

export default function AdminSettings() {
  const { lang, theme, toggleTheme } = useAppStore();
  const { show } = useToast();
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSystemSettings();
        if (data && data.length > 0) {
          const vat = data.find((s: any) => s.key === 'vat_rate');
          if (vat) setVatRate(Number(vat.value) || 15);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSaveVat = async () => {
    try {
      const { data } = await getSystemSettings();
      const vatSetting = data?.find((s: any) => s.key === 'vat_rate');
      if (vatSetting) {
        await updateSystemSetting(vatSetting.id, { value: String(vatRate) });
      }
      await addAuditLog({
        user_name: t('audit_supervisor', lang),
        action_ar: t('admin_audit_update_vat', lang).replace('{rate}', String(vatRate)),
        action_type: 'update',
        details: t('admin_audit_vat_details', lang).replace('{rate}', String(vatRate)),
      });
      show(t('settings_saved', lang), 'success');
    } catch {
      show(t('settings_save_failed', lang), 'error');
    }
  };

  return (
    <div className="admin-page" id="apSettings">
      <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>{t('settings_title', lang)}</div>

      <div className="admin-table-wrap" style={{ maxWidth: 600 }}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('dark_mode_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('dark_mode_desc', lang)}</div></div>
            <button className={`theme-switch ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
              <div className="theme-switch-knob">{theme === 'dark' ? '🌙' : '☀️'}</div>
            </button>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('vat_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('vat_rate_desc', lang).replace('{rate}', String(vatRate))}</div></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} style={{ width: 70, padding: 8, borderRadius: 8, border: '1px solid var(--latte)' }} />
              <button className="action-btn secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '.8rem' }} onClick={handleSaveVat}>{t('save_btn', lang)}</button>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('notif_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('notif_desc', lang)}</div></div>
            <label className="switch"><input type="checkbox" defaultChecked /><span className="slider" /></label>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('backup_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('backup_desc', lang)}</div></div>
            <button className="action-btn secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '.8rem' }}>📥 {t('backup_label', lang)}</button>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('currency_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--text-light)' }}>{t('currency_desc', lang)}</div></div>
            <select className="coffee-input" style={{ width: 140 }}>
              <option>{t('sar', lang)}</option>
              <option>{t('usd', lang)}</option>
              <option>{t('aed', lang)}</option>
            </select>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{t('danger_label', lang)}</strong><div style={{ fontSize: '.78rem', color: 'var(--red)' }}>{t('danger_desc', lang)}</div></div>
            <button className="action-btn secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '.8rem', borderColor: 'var(--red)', color: 'var(--red)' }}
              onClick={async () => {
                try {
                  await clearAllOrders();
                  localStorage.removeItem('sabaa_state');
                  show('✅ ' + t('data_deleted', lang), 'success');
                  setTimeout(() => window.location.reload(), 1500);
                } catch {
                  show(t('settings_save_failed', lang), 'error');
                }
              }}>
              {t('delete_btn', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
