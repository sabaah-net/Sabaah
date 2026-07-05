'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase, addAuditLog, createMenuItem, fetchPendingMenuItems, updatePendingMenuItemStatus } from '../../lib/supabase';

interface PendingPartner {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  cr_file_url?: string;
  created_at: string;
}

export default function AdminApprovals() {
  const { lang } = useAppStore();
  const [pending, setPending] = useState<PendingPartner[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'partners' | 'items'>('partners');

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, auth_id, first_name, last_name, email, phone, city, cr_file_url, created_at')
      .eq('role', 'Partner')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPending(data as PendingPartner[]);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const fetchPendingItems = async () => {
    const { data } = await fetchPendingMenuItems();
    if (data) setPendingItems(data as any[]);
  };

  useEffect(() => { fetchPendingItems(); }, []);

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

  const handleApproveItem = async (item: any) => {
    setActionLoading(item.id);
    await createMenuItem({
      name_ar: item.name_ar,
      name_en: item.name_en || item.name_ar,
      description: item.description,
      base_price: item.base_price,
      cafe_id: item.cafe_id,
      status: 'active',
      icon: item.icon,
    }).catch(() => {});
    await updatePendingMenuItemStatus(item.id, 'approved');
    addAuditLog({
      user_name: 'Admin',
      action_ar: `Approved menu item: ${item.name_ar}`,
      action_type: 'create',
      details: `Menu item approved from partner ${item.cafe_name}`,
    }).catch(() => {});
    fetchPendingItems();
    setActionLoading(null);
  };

  const handleRejectItem = async (item: any) => {
    setActionLoading(item.id);
    await updatePendingMenuItemStatus(item.id, 'rejected');
    fetchPendingItems();
    setActionLoading(null);
  };

  return (
    <div className="admin-page" id="apApprovals">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>✅ {lang === 'ar' ? 'الموافقات' : 'Approvals'}</div>
        <div className="admin-tabs" style={{ margin: 0 }}>
          <button className={`admin-tab ${tab === 'partners' ? 'active' : ''}`} onClick={() => setTab('partners')}>
            {lang === 'ar' ? 'شركاء' : 'Partners'} {pending.length > 0 && <span className="table-badge badge-red" style={{ marginLeft: 4 }}>{pending.length}</span>}
          </button>
          <button className={`admin-tab ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>
            {lang === 'ar' ? 'عناصر' : 'Items'} {pendingItems.filter(i => i.status === 'pending').length > 0 && <span className="table-badge badge-red" style={{ marginLeft: 4 }}>{pendingItems.filter(i => i.status === 'pending').length}</span>}
          </button>
        </div>
      </div>

      {tab === 'partners' && (
        <>
          {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>Loading...</p>}
          {!loading && pending.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>{lang === 'ar' ? 'لا توجد طلبات موافقة معلقة' : 'No pending approval requests'}</div>
          )}
          {pending.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th><th>{lang === 'ar' ? 'الاسم' : 'Name'}</th><th>Email</th><th>{lang === 'ar' ? 'الهاتف' : 'Phone'}</th><th>{lang === 'ar' ? 'الموقع' : 'Location'}</th><th>CR</th><th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th><th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
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
                      <td>{p.cr_file_url ? <a href={p.cr_file_url} target="_blank" rel="noopener" style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '.8rem' }}>📄 View</a> : <span style={{ color: 'var(--text-light)', fontSize: '.75rem' }}>—</span>}</td>
                      <td style={{ fontSize: '.8rem' }}>{new Date(p.created_at).toLocaleDateString('en-US')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.75rem', margin: 0, background: 'var(--green)', color: '#fff' }}
                            disabled={actionLoading === p.id} onClick={() => handleApprove(p)}>
                            ✅ {lang === 'ar' ? 'موافقة' : 'Approve'}
                          </button>
                          <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.75rem', margin: 0, background: 'var(--red)', color: '#fff' }}
                            disabled={actionLoading === p.id} onClick={() => handleReject(p)}>
                            ❌ {lang === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendingItems.filter(i => i.status === 'pending').length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'لا توجد عناصر قائمة معلقة' : 'No pending menu items'}</div>
          )}
          {pendingItems.filter(i => i.status === 'pending').map((item: any) => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 14, boxShadow: 'var(--sh-sm)', borderRight: '4px solid var(--amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{item.icon} {item.name_ar}</div>
                  <div style={{ fontSize: '.78rem' }}>{item.name_en} — {item.base_price} ⃁</div>
                  <div style={{ fontSize: '.75rem' }}>{item.description}</div>
                  <div style={{ fontSize: '.7rem', fontWeight: 600, marginTop: 4 }}>
                    🏪 {item.cafe_name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.72rem', margin: 0, background: 'var(--green)', color: '#fff' }}
                    disabled={actionLoading === item.id} onClick={() => handleApproveItem(item)}>
                    ✅ {lang === 'ar' ? 'موافقة' : 'Approve'}
                  </button>
                  <button className="action-btn" style={{ width: 'auto', padding: '5px 12px', fontSize: '.72rem', margin: 0, background: 'var(--red)', color: '#fff' }}
                    disabled={actionLoading === item.id} onClick={() => handleRejectItem(item)}>
                    ❌ {lang === 'ar' ? 'رفض' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingItems.filter(i => i.status !== 'pending').length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 8 }}>
                {lang === 'ar' ? 'سجل الموافقات' : 'Approval History'}
              </div>
              {pendingItems.filter(i => i.status !== 'pending').map((item: any) => (
                <div key={item.id} style={{ background: '#f9f9f9', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.78rem' }}>
                  <span style={{ fontWeight: 700 }}>{item.icon} {item.name_ar}</span>
                  <span className={`table-badge badge-${item.status === 'approved' ? 'green' : 'red'}`} style={{ fontWeight: 700 }}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
