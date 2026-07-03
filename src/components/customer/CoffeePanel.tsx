'use client';
const items = [
  { type: 'black', icon: '☕', label: 'سوداء', price: '7 ⃁' },
  { type: 'white', icon: '🥛', label: 'بيضاء', price: '7 ⃁' },
  { type: 'iced', icon: '🧊', label: 'مثلجة', price: '7 ⃁' },
  { type: 'spanish', icon: '🍯', label: 'إسباني', price: '9 ⃁' },
  { type: 'turkish', icon: '🫖', label: 'تركية', price: '8 ⃁' },
  { type: 'mocha', icon: '🍫', label: 'موكا', price: '10 ⃁' },
];

interface CoffeePanelProps {
  visible: boolean;
  onAddToCart: (type: string) => void;
  selectedTypes: string[];
}

export default function CoffeePanel({ visible, onAddToCart, selectedTypes }: CoffeePanelProps) {
  if (!visible) return null;

  return (
    <div className="coffee-panel">
      <p className="section-title">☕ ما نوع قهوتك؟</p>
      <div className="coffee-grid">
        {items.map((item) => (
          <button
            key={item.type}
            className={`coffee-btn ${selectedTypes.includes(item.type) ? 'selected' : ''}`}
            onClick={() => onAddToCart(item.type)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
            <span className="price">{item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
