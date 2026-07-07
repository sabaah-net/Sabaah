'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

const PLACEHOLDER_INVENTORY = [
  { name: 'حبوب القهوة', level: 72, unit: '%' },
  { name: 'حليب', level: 45, unit: '%' },
  { name: 'سكر', level: 90, unit: '%' },
  { name: 'أكواب', level: 30, unit: '%' },
  { name: 'شوكولاتة', level: 15, unit: '%' },
  { name: 'سنيكرز', level: 60, unit: '%' },
];

export default function PartnerInventory() {
  const store = useAppStore();
  const lang = store.lang;
  const items = store.inventory.length > 0 ? store.inventory : PLACEHOLDER_INVENTORY as any;

  return (
    <div>
      <p className="section-title">{t('partner_inv_title', lang)}</p>
      <div className="inv-grid">
        {items.map((item: any, i: number) => {
          const level = typeof item.level === 'number' ? item.level : 50;
          const levelClass = level < 20 ? 'low' : level < 50 ? 'medium' : '';
          const color = level < 20 ? 'var(--red)' : level < 50 ? 'var(--amber)' : 'var(--green)';
          return (
            <div key={i} className={`inv-card ${levelClass}`}>
              <div className="inv-name">{item.name}</div>
              <div className="inv-level">{level}{item.unit || '%'} {level < 20 ? '⚠️' : ''}</div>
              <div className="inv-bar">
                <div className="inv-bar-fill" style={{ width: `${level}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
      <button className="action-btn secondary" style={{ fontSize: '.8rem', width: '100%' }}>{t('partner_supply_order', lang)}</button>
    </div>
  );
}
