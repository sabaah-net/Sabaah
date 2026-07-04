export { useToast } from '../components/shared/Toast';

export function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function formatCurrency(val: number): string {
  return '⃁ ' + val.toFixed(2);
}
