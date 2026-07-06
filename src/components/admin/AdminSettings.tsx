'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getSystemSettings, updateSystemSetting, addAuditLog } from '../../lib/supabase';
import { useToast } from '../shared/Toast';
import { t } from '../../i18n';
import type { Addon } from '../../types';

export default function AdminSettings() {
  const { lang, theme, toggleTheme, addons, currency } = useAppStore();
  const { show } = useToast();
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [addonList, setAddonList] = useState<Addon[]>(addons);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);

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
            <select className="coffee-input" style={{ width: 140, fontSize: '.85rem', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--latte)', background: '#fff', appearance: 'auto' }} value={currency} onChange={(e) => {
              useAppStore.getState().setCurrency?.(e.target.value);
              show('✅ ' + (lang === 'ar' ? 'تم تحديث العملة' : 'Currency updated'), 'success');
            }}>
              <option value="SAR">{t('sar', lang)}</option>
              <option value="USD">{t('usd', lang)}</option>
              <option value="AED">{t('aed', lang)}</option>
            </select>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--latte)' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '.9rem', marginBottom: 8 }}>🧃 {lang === 'ar' ? 'إدارة الإضافات' : 'Add-ons Management'}</div>
            <div style={{ fontSize: '.78rem', marginBottom: 10 }}>{lang === 'ar' ? 'تعديل اسم وسعر وأيقونة كل إضافة' : 'Edit name, price & icon for each add-on'}</div>
            {addonList.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{a.icon}</span>
                {editingAddonId === a.id ? (
                  <>
                    <input className="coffee-input" style={{ flex: 2, margin: 0 }} value={a.name} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], name: e.target.value }; setAddonList(list);
                    }} placeholder={lang === 'ar' ? 'الاسم (عربي)' : 'Name (Ar)'} />
                    <input className="coffee-input" style={{ flex: 2, margin: 0 }} value={a.nameEn} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], nameEn: e.target.value }; setAddonList(list);
                    }} placeholder={lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (En)'} />
                    <input className="coffee-input" style={{ width: 60, margin: 0 }} type="number" value={a.price} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], price: Math.max(0, parseFloat(e.target.value) || 0) }; setAddonList(list);
                    }} />
                    <input className="coffee-input" style={{ width: 50, margin: 0 }} value={a.icon} onChange={(e) => {
                      const list = [...addonList]; list[i] = { ...list[i], icon: e.target.value }; setAddonList(list);
                    }} />
                    <button className="action-btn secondary" style={{ width: 'auto', padding: '6px 10px', fontSize: '.7rem', margin: 0 }}
                      onClick={() => {
                        const s = useAppStore.getState();
                        (s as any).setAddons?.(addonList);
                        setEditingAddonId(null);
                        show('✅ ' + (lang === 'ar' ? 'تم الحفظ' : 'Saved'), 'success');
                      }}>
                      💾
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 2, fontWeight: 700, fontSize: '.85rem' }}>{a.name}</span>
                    <span style={{ flex: 2, fontSize: '.8rem' }}>{a.nameEn}</span>
                    <span style={{ width: 60, fontWeight: 600 }}>{a.price} ⃁</span>
                    <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 8px', fontSize: '.7rem', margin: 0 }}
                      onClick={() => setEditingAddonId(a.id)}>
                      ✏️
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
