'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ref, onValue, off } from 'firebase/database';
import { db, watchComplaints, updateComplaint, pushComplaint } from '../../lib/firebase';
import type { Complaint } from '../../types';

export default function AdminComplaints() {
  const { lang } = useAppStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    return watchComplaints(setComplaints);
  }, []);

  const handleStatusChange = (id: string, status: Complaint['status']) => {
    updateComplaint(id, { status });
  };

  return (
    <div className="admin-page" id="apComplaints">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>⚠️ {lang === 'ar' ? 'الشكاوى' : 'Complaints'}</div>
        <span style={{ fontSize: '.82rem', color: 'var(--text-light)' }}>
          {complaints.length} {lang === 'ar' ? 'شكوى' : 'complaints'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {complaints.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            {lang === 'ar' ? 'لا توجد شكاوى' : 'No complaints'}
          </div>
        )}
        {complaints.map((c) => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: 'var(--r-md)', padding: 14,
            boxShadow: 'var(--sh-sm)', borderLeft: `4px solid ${
              c.status === 'open' ? 'var(--red)' : c.status === 'in_progress' ? 'var(--amber)' : 'var(--green)'
            }`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{c.subject}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-light)' }}>
                  {c.userName} — {new Date(c.createdAt).toLocaleDateString('en-US')}
                </div>
              </div>
              <select
                className="coffee-input"
                style={{ width: 'auto', margin: 0, padding: '3px 8px', fontSize: '.72rem' }}
                value={c.status}
                onChange={(e) => handleStatusChange(c.id, e.target.value as Complaint['status'])}
              >
                <option value="open">{lang === 'ar' ? 'مفتوحة' : 'Open'}</option>
                <option value="in_progress">{lang === 'ar' ? 'قيد المعالجة' : 'In Progress'}</option>
                <option value="resolved">{lang === 'ar' ? 'تم الحل' : 'Resolved'}</option>
                <option value="closed">{lang === 'ar' ? 'مغلقة' : 'Closed'}</option>
              </select>
            </div>
            <div style={{ fontSize: '.82rem', color: 'var(--text)', marginBottom: 4 }}>{c.description}</div>
            {c.orderId && (
              <div style={{ fontSize: '.7rem', color: 'var(--text-light)' }}>
                🆔 {lang === 'ar' ? 'الطلب' : 'Order'}: {c.orderId}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
