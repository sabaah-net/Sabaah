export default function PriceTag({ value }: { value: number }) {
  return (
    <span className="price">
      <span className="currency-sym">⃁</span>
      {value.toFixed(2)}
    </span>
  );
}
