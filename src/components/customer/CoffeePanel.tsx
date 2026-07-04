'use client';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
const items = [
  { type: 'black', icon: '☕', price: '7 ⃁' },
  { type: 'white', icon: '🥛', price: '7 ⃁' },
  { type: 'iced', icon: '🧊', price: '7 ⃁' },
  { type: 'spanish', icon: '🍯', price: '9 ⃁' },
  { type: 'turkish', icon: '🫖', price: '8 ⃁' },
  { type: 'mocha', icon: '🍫', price: '10 ⃁' },
];

interface CoffeePanelProps {
  visible: boolean;
  onAddToCart: (type: string) => void;
  selectedTypes: string[];
}

export default function CoffeePanel({ visible, onAddToCart, selectedTypes }: CoffeePanelProps) {
  const store = useAppStore();
  if (!visible) return null;

  return (
    <div className="coffee-panel">
      <p className="section-title">{t('coffee_type', store.lang)}</p>
      <div className="coffee-grid">
        {items.map((item) => (
          <button
            key={item.type}
            className={`coffee-btn ${selectedTypes.includes(item.type) ? 'selected' : ''}`}
            onClick={() => onAddToCart(item.type)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{t(item.type, store.lang)}</span>
            <span className="price">{item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
