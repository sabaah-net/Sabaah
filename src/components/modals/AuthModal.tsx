'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { useToast } from '../shared/Toast';

export default function AuthModal() {
  const { lang, signIn, signUp } = useAppStore();
  const { show } = useToast();
  const [tab, setTab] = useState<'login' | 'register' | 'partner'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string>('');
  const [lastName, setLastName] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [crFile, setCrFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const crExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
  const handleCrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!crExtensions.includes(ext)) {
      show('Only PDF, PNG, JPG files are allowed', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      show('File must be under 2 MB', 'error');
      e.target.value = '';
      return;
    }
    setCrFile(file);
  };

  const handleSubmit = async () => {
    if (!email || !pass) { show(t('error_email_password', lang), 'error'); return; }
    if (tab === 'register' && !name) { show(t('error_name_required', lang), 'error'); return; }
    if (tab === 'partner' && !name) { show(t('error_name_required', lang), 'error'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, pass);
        show(t('success_login', lang), 'success');
        closeModal();
        return;
      }
      if (tab === 'register') {
        await signUp(email, pass, name, phone);
        show(t('success_signup', lang), 'success');
        closeModal();
        return;
      }
      if (tab === 'partner') {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || name;
        const lastNamePart = lastName || nameParts.slice(1).join(' ') || '';
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { first_name: firstName, last_name: lastNamePart } },
        });
        if (authError) throw authError;
        const authUserId = authData?.user?.id;
        if (!authUserId) throw new Error('Account creation failed');

        let crFileUrl = '';
        if (crFile) {
          const ext = crFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filePath = `cr_${authUserId}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('partner_docs').upload(filePath, crFile, {
            cacheControl: '3600', upsert: true,
          });
          if (uploadError) throw uploadError;
          const { data: pubData } = supabase.storage.from('partner_docs').getPublicUrl(filePath);
          crFileUrl = pubData?.publicUrl || '';
        }

        const { error: profileError } = await supabase.from('profiles').insert({
          auth_id: authUserId,
          phone: phone || '',
          email,
          first_name: firstName,
          last_name: lastNamePart,
          role: 'Partner',
          status: 'pending',
          city: mapsUrl || 'riyadh',
          wallet_balance: 0,
          loyalty_points: 0,
          loyalty_tier: 'bronze',
          streak: 0,
          cr_file_url: crFileUrl || null,
        }).select().single();
        if (profileError) throw profileError;

        await supabase.from('profiles').update({ password: pass }).eq('auth_id', authUserId);

        try {
          await supabase.functions.invoke('partner-register', {
            body: {
              subject: `New Partner Registration: ${firstName} ${lastNamePart}`,
              html: `
                <h2>New Partner Registration</h2>
                <p><strong>Name:</strong> ${firstName} ${lastNamePart}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || '—'}</p>
                <p><strong>Location:</strong> ${mapsUrl || '—'}</p>
                ${crFileUrl ? `<p><strong>CR File:</strong> <a href="${crFileUrl}">View Document</a></p>` : ''}
                <p><strong>Status:</strong> Pending — awaiting admin approval</p>
              `,
            },
          });
        } catch {}

        show(t('success_signup', lang), 'success');
        closeModal();
      }
    } catch (e: any) {
      show(e.message || t('error_generic', lang), 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    document.getElementById('authModal')?.classList.remove('open');
    setCrFile(null);
  };

  const tabBtn = (value: 'login' | 'register' | 'partner', label: string) => (
    <button style={{
      flex: 1, padding: '10px 6px', border: 'none',
      background: tab === value ? 'var(--amber)' : 'transparent',
      color: tab === value ? '#fff' : 'var(--text)',
      fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'all .2s',
    }} onClick={() => setTab(value)}>{label}</button>
  );

  return (
    <div className="modal-overlay" id="authModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div className="modal-title">{t('sign_in', lang)}</div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--latte)' }}>
          {tabBtn('login', t('sign_in_tab', lang))}
          {tabBtn('register', t('register_tab', lang))}
          {tabBtn('partner', 'Partner')}
        </div>

        {tab !== 'login' && tab === 'register' && (
          <input className="coffee-input" placeholder={t('name_placeholder', lang)} value={name} onChange={(e) => setName(e.target.value)} />
        )}
        {tab === 'partner' && (
          <input className="coffee-input" placeholder="First Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        {tab === 'partner' && (
          <input className="coffee-input" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        )}
        {tab !== 'login' && (
          <input className="coffee-input" placeholder={t('phone_placeholder', lang)} value={phone} onChange={(e) => setPhone(e.target.value)} />
        )}

        {tab === 'partner' && (
          <>
            <input className="coffee-input" placeholder="Google Maps Location URL" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 4 }}>CR Copy (max 2 MB)</div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                border: '2px dashed var(--latte)', borderRadius: 10, cursor: 'pointer', fontSize: '.82rem',
              }}>
                <span style={{ fontSize: '1.2rem' }}>📎</span>
                <span style={{ color: crFile ? 'var(--text)' : 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {crFile ? crFile.name : 'Choose file ...'}
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCrFile} style={{ display: 'none' }} />
              </label>
            </div>
          </>
        )}

        {tab === 'register' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 6, display: 'block' }}>{t('gender_label', lang)}</div>
            <div className="gender-select">
              <div className={`gender-option${gender === 'male' ? ' selected' : ''}`} onClick={() => setGender('male')}>
                <span className="gender-icon">♂️</span>
                {t('gender_male', lang)}
              </div>
              <div className={`gender-option${gender === 'female' ? ' selected' : ''}`} onClick={() => setGender('female')}>
                <span className="gender-icon">♀️</span>
                {t('gender_female', lang)}
              </div>
            </div>
          </div>
        )}
        <input className="coffee-input" type="email" placeholder={t('email_placeholder', lang)} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="coffee-input" type="password" placeholder={t('password_placeholder', lang)} value={pass} onChange={(e) => setPass(e.target.value)} />
        <button className="action-btn" style={{ width: '100%', opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSubmit}>
          {loading ? t('loading', lang) : (tab === 'login' ? t('sign_in_tab', lang) : tab === 'partner' ? (t('register_as_partner', lang) || 'Register as Partner') : t('create_account', lang))}
        </button>
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', top: 14, left: 14 }}>✕</button>
      </div>
    </div>
  );
}
