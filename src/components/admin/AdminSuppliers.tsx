'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ref, onValue, off, db, pushSupplier, updateSupplier, removeSupplier } from '../../lib/firebase';
import type { Supplier } from '../../types';

export default function AdminSuppliers() {
  const { lang } = useAppStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', material: '' });

  useEffect(() => {
    const r = ref(db, 'suppliers');
    const fn = onValue(r, (snap) => {
      const val = snap.val();
      setSuppliers(val ? Object.values(val) as Supplier[] : []);
    });
    return () => off(r, 'value', fn);
  }, []);

  const handleAdd = () => {
    if (!form.name) return;
    pushSupplier({ ...form, status: 'active' });
    setForm({ name: '', contactPerson: '', phone: '', email: '', material: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'حذف هذا المورد؟' : 'Delete this supplier?')) removeSupplier(id);
  };

  return (
    <div className="admin-page" id="apSuppliers">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>🚚 {lang === 'ar' ? 'الموردون' : 'Suppliers'}</div>
        <button className="action-btn" style={{ width: 'auto', padding: '8px 18px', fontSize: '.8rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : '+ '}{lang === 'ar' ? 'إضافة مورد' : 'Add Supplier'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="coffee-input" placeholder={lang === 'ar' ? 'اسم المورد *' : 'Supplier name *'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'جهة اتصال' : 'Contact person'} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'الهاتف' : 'Phone'} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'البريد' : 'Email'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="coffee-input" placeholder={lang === 'ar' ? 'المواد الموردة' : 'Supplied material'} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          <button className="action-btn" style={{ width: '100%' }} onClick={handleAdd}>
            {lang === 'ar' ? '💾 حفظ' : '💾 Save'}
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>{lang === 'ar' ? 'الاسم' : 'Name'}</th><th>{lang === 'ar' ? 'جهة اتصال' : 'Contact'}</th><th>{lang === 'ar' ? 'الهاتف' : 'Phone'}</th><th>{lang === 'ar' ? 'المواد' : 'Material'}</th><th>{lang === 'ar' ? 'الحالة' : 'Status'}</th><th>{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>{lang === 'ar' ? 'لا يوجد موردون' : 'No suppliers'}</td></tr>
            )}
            {suppliers.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td><strong>{s.name}</strong></td>
                <td>{s.contactPerson || '-'}</td>
                <td>{s.phone || '-'}</td>
                <td>{s.material || '-'}</td>
                <td><span className={`table-badge badge-${s.status === 'active' ? 'green' : 'amber'}`}>{s.status}</span></td>
                <td>
                  <button className="action-btn secondary" style={{ width: 'auto', padding: '4px 10px', fontSize: '.72rem', margin: 0, background: 'var(--red)', color: '#fff' }}
                    onClick={() => handleDelete(s.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
