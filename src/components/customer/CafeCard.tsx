'use client';
import type { Cafe } from '../../types';

interface CafeCardProps {
  cafe: Cafe;
  selected: boolean;
  lang: string;
  onSelect: (cafe: Cafe) => void;
  onToggleFav: (id: number) => void;
}

export default function CafeCard({ cafe, selected, lang, onSelect, onToggleFav }: CafeCardProps) {
  return (
    <div
      className={`cafe-card ${cafe.isOpen ? '' : 'closed-cafe'} ${selected ? 'selected' : ''}`}
      onClick={() => cafe.isOpen && onSelect(cafe)}
    >
      <button
        className={`cafe-fav ${cafe.favorited ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFav(cafe.id); }}
      >
        ♥
      </button>
      <div className="cafe-avatar">{cafe.emoji}</div>
      <div className="cafe-meta">
        <div className="cafe-name">{lang === 'ar' ? cafe.name : cafe.nameEn}</div>
        <div className="cafe-sub">{cafe.sub}</div>
        <div style={{ fontSize: '.65rem', color: 'var(--text-light)', marginTop: 3 }}>
          ⏱️ {cafe.waitTime} • ♥ {cafe.favorites}
        </div>
      </div>
      <div className="cafe-right">
        <div className="cafe-rating">⭐ {cafe.rating}</div>
        <div className={`cafe-status-badge ${cafe.isOpen ? 'open' : 'closed'}`}>
          {cafe.isOpen ? (lang === 'ar' ? 'مفتوح' : 'Open') : (lang === 'ar' ? 'مغلق' : 'Closed')}
        </div>
        <div style={{ fontSize: '.7rem', color: 'var(--text-light)', marginTop: 2 }}>{cafe.dist}</div>
      </div>
    </div>
  );
}
