'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function PartnerStaff() {
  const store = useAppStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState('باريستا');
  const [shift, setShift] = useState('صباحي');

  const handleAdd = () => {
    if (!name.trim()) return;
    const current = useAppStore.getState().staff;
    useAppStore.setState({ staff: [...current, { name, role, shift, status: 'active' }] });
    setName('');
  };

  return (
    <div>
      <p className="section-title">👥 إدارة الموظفين</p>

      <div className="emp-add-form">
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 10 }}>➕ إضافة موظف جديد</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <input className="form-input" placeholder="اسم الموظف" style={{ margin: 0 }} value={name} onChange={(e) => setName(e.target.value)} />
          <select className="form-input" style={{ margin: 0 }} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="باريستا">باريستا ☕</option>
            <option value="كاشير">كاشير 💵</option>
            <option value="مدير">مدير 📋</option>
          </select>
          <select className="form-input" style={{ margin: 0 }} value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="صباحي">وردية صباحية 🌅</option>
            <option value="مسائي">وردية مسائية 🌙</option>
            <option value="يوم كامل">يوم كامل 📅</option>
          </select>
        </div>
        <button className="action-btn green-btn" style={{ fontSize: '.85rem', padding: 8 }} onClick={handleAdd}>✅ إضافة موظف</button>
      </div>

      <p className="section-title">👥 موظفو اليوم</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {store.staff.map((s, i) => (
          <div key={i} className="emp-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--latte)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.9rem',
              }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: '.65rem', color: 'var(--text-light)' }}>{s.role} • {s.shift}</div>
              </div>
            </div>
            <button className="emp-delete-btn" onClick={() => {
              useAppStore.setState({ staff: useAppStore.getState().staff.filter((_, idx) => idx !== i) });
            }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
