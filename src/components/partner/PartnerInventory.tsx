'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';

export default function PartnerInventory() {
  const store = useAppStore();
  const lang = store.lang;

  return (
    <div>
      <p className="section-title">{t('partner_inv_title', lang)}</p>
      <div className="inv-grid">
        {store.inventory.map((item, i) => {
          const levelClass = item.level < 20 ? 'low' : item.level < 50 ? 'medium' : '';
          const color = item.level < 20 ? 'var(--red)' : item.level < 50 ? 'var(--amber)' : 'var(--green)';
          return (
            <div key={i} className={`inv-card ${levelClass}`}>
              <div className="inv-name">{item.name}</div>
              <div className="inv-level">{item.level} {item.unit} {item.level < 20 ? '⚠️' : ''}</div>
              <div className="inv-bar">
                <div className="inv-bar-fill" style={{ width: `${item.level}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
      <button className="action-btn secondary" style={{ fontSize: '.8rem' }}>{t('partner_supply_order', lang)}</button>
    </div>
  );
}
