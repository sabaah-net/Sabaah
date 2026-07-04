'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, addAuditLog } from '../../lib/supabase';

interface PendingPartner {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
}

export default function AdminApprovals() {
  const { lang } = useAppStore();
  const [pending, setPending] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, auth_id, first_name, last_name, email, phone, city, created_at')
      .eq('role', 'Partner')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPending(data as PendingPartner[]);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (partner: PendingPartner) => {
    setActionLoading(partner.id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', partner.id);
    addAuditLog({
      user_name: 'Admin',
      action_ar: `Approved partner: ${partner.first_name} ${partner.last_name}`,
      action_type: 'user',
      details: `Partner approved`,
    }).catch(() => {});
    setPending(p => p.filter(x => x.id !== partner.id));
    setActionLoading(null);
  };

  const handleReject = async (partner: PendingPartner) => {
    setActionLoading(partner.id);
    await supabase.from('profiles').update({ status: 'banned' }).eq('id', partner.id);
    if (partner.auth_id) {
      await supabase.auth.admin.deleteUser(partner.auth_id).catch(() => {});
    }
    addAuditLog({
      user_name: 'Admin',
      action_ar: `Rejected partner: ${partner.first_name} ${partner.last_name}`,
      action_type: 'user',
      details: `Partner rejected`,
    }).catch(() => {});
    setPending(p => p.filter(x => x.id !== partner.id));
    setActionLoading(null);
  };

  return (
    <div className="admin-page" id="apApprovals">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>✅ Partner Approvals</div>
        <button className="action-btn primary" style={{ width: 'auto', padding: '7px 16px', fontSize: '.8rem' }} onClick={fetchPending}>
          🔄 Refresh
        </button>
      </div>

      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>Loading...</p>}

      {!loading && pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
          No pending approval requests
        </div>
      )}

      {pending.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td><strong>{p.first_name} {p.last_name}</strong></td>
                  <td>{p.email}</td>
                  <td>{p.phone || '-'}</td>
                  <td style={{ fontSize: '.8rem', color: 'var(--text-light)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.city}</td>
                  <td style={{ fontSize: '.8rem' }}>{new Date(p.created_at).toLocaleDateString('en-US')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.75rem', margin: 0, background: 'var(--green)', color: '#fff' }}
                        disabled={actionLoading === p.id} onClick={() => handleApprove(p)}>
                        ✅ Approve
                      </button>
                      <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.75rem', margin: 0, background: 'var(--red)', color: '#fff' }}
                        disabled={actionLoading === p.id} onClick={() => handleReject(p)}>
                        ❌ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
