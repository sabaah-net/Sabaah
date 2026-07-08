'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../lib/firebase';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  cafe_name: string;
  total_amount: number;
  status: string;
  pickup_code: string;
  created_at: string;
  payment_method: string;
}

export default function AdminOrders() {
  const { lang } = useAppStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const r = ref(db, 'orders');
    const fn = onValue(r, (snap) => {
      const val: Record<string, any> = snap.val() || {};
      const all: OrderRow[] = [];
      for (const uid of Object.keys(val)) {
        for (const oid of Object.keys(val[uid])) {
          all.push({ id: oid, ...val[uid][oid] });
        }
      }
      all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setOrders(all);
    });
    return () => off(r, 'value', fn);
  }, []);

  const filtered = filter
    ? orders.filter((o) =>
        (o.order_number || o.id).toLowerCase().includes(filter.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(filter.toLowerCase())
      )
    : orders;

  return (
    <div className="admin-page" id="apOrders">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>📦 {lang === 'ar' ? 'جميع الطلبات' : 'All Orders'}</div>
        <input
          className="coffee-input"
          style={{ width: 220, margin: 0 }}
          placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{lang === 'ar' ? 'رقم الطلب' : 'Order'}</th>
              <th>{lang === 'ar' ? 'العميل' : 'Customer'}</th>
              <th>{lang === 'ar' ? 'المقهى' : 'Cafe'}</th>
              <th>{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th>{lang === 'ar' ? 'طريقة الدفع' : 'Payment'}</th>
              <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}</td></tr>
            )}
            {filtered.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td><strong>{o.order_number || o.id}</strong></td>
                <td>{o.customer_name || '-'}</td>
                <td>{o.cafe_name || '-'}</td>
                <td>{o.total_amount ? <>{Number(o.total_amount).toFixed(2)}<span className="currency-sym">﷼</span></> : '-'}</td>
                <td><span className="table-badge badge-amber">{o.payment_method || '-'}</span></td>
                <td><span className={`table-badge badge-${o.status === 'completed' ? 'green' : o.status === 'pending' ? 'amber' : 'blue'}`}>{o.status}</span></td>
                <td style={{ fontSize: '.78rem' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
