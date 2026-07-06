'use client';
import type { Cafe, Lang } from '../../types';
import { t } from '../../i18n';

interface CafeCardProps {
  cafe: Cafe;
  selected: boolean;
  lang: Lang;
  onSelect: (cafe: Cafe) => void;
}

export default function CafeCard({ cafe, selected, lang, onSelect }: CafeCardProps) {
  return (
    <div
      className={`cafe-card ${cafe.isOpen ? '' : 'closed-cafe'} ${selected ? 'selected' : ''}`}
      onClick={() => cafe.isOpen && onSelect(cafe)}
    >
      <div className="cafe-avatar">{cafe.emoji}</div>
      <div className="cafe-meta">
        <div className="cafe-name">{lang === 'ar' ? cafe.name : cafe.nameEn}</div>
        <div className="cafe-sub">{cafe.sub}</div>
        <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 3 }}>
          ⏱️ {cafe.waitTime}
        </div>
      </div>
      <div className="cafe-right">
        <div className="cafe-rating">⭐ {cafe.rating}</div>
        <div className={`cafe-status-badge ${cafe.isOpen ? 'open' : 'closed'}`}>
          {cafe.isOpen ? t('open_label', lang) : t('closed_label', lang)}
        </div>
        <div style={{ fontSize: '.7rem', color: 'var(--text-light)', marginTop: 2 }}>{cafe.dist}</div>
      </div>
    </div>
  );
}
