'use client';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useToast } from '../shared/Toast';

export default function AuthModal() {
  const { lang, signIn, signUp } = useAppStore();
  const { show } = useToast();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !pass) { show(t('error_email_password', lang), 'error'); return; }
    if (tab === 'register' && !name) { show(t('error_name_required', lang), 'error'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, pass);
        show(t('success_login', lang), 'success');
      } else {
        await signUp(email, pass, name, phone);
        show(t('success_signup', lang), 'success');
      }
      closeModal();
    } catch (e: any) {
      show(e.message || t('error_generic', lang), 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => document.getElementById('authModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="authModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{t('sign_in', lang)}</div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--latte)' }}>
          <button style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'login' ? 'var(--amber)' : 'transparent', color: tab === 'login' ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s' }} onClick={() => setTab('login')}>{t('sign_in_tab', lang)}</button>
          <button style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'register' ? 'var(--amber)' : 'transparent', color: tab === 'register' ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s' }} onClick={() => setTab('register')}>{t('register_tab', lang)}</button>
        </div>
        {tab === 'register' && (
          <input className="coffee-input" placeholder={t('name_placeholder', lang)} value={name} onChange={(e) => setName(e.target.value)} />
        )}
        {tab === 'register' && (
          <input className="coffee-input" placeholder={t('phone_placeholder', lang)} value={phone} onChange={(e) => setPhone(e.target.value)} />
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
          {loading ? t('loading', lang) : (tab === 'login' ? t('sign_in_tab', lang) : t('create_account', lang))}
        </button>
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', top: 14, left: 14 }}>✕</button>
      </div>
    </div>
  );
}
