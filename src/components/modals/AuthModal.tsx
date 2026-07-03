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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !pass) { show('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error'); return; }
    if (tab === 'register' && !name) { show('يرجى إدخال الاسم', 'error'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, pass);
        show('تم تسجيل الدخول بنجاح ✨', 'success');
      } else {
        await signUp(email, pass, name, phone);
        show('تم إنشاء الحساب بنجاح 🎉', 'success');
      }
      closeModal();
    } catch (e: any) {
      show(e.message || 'حدث خطأ، تحقق من البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => document.getElementById('authModal')?.classList.remove('open');

  return (
    <div className="modal-overlay" id="authModal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{t('sign_in', lang) || 'تسجيل الدخول'}</div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--latte)' }}>
          <button style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'login' ? 'var(--amber)' : 'transparent', color: tab === 'login' ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s' }} onClick={() => setTab('login')}>تسجيل دخول</button>
          <button style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'register' ? 'var(--amber)' : 'transparent', color: tab === 'register' ? '#fff' : 'var(--text)', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s' }} onClick={() => setTab('register')}>حساب جديد</button>
        </div>
        {tab === 'register' && (
          <input className="coffee-input" placeholder="الاسم كامل" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        {tab === 'register' && (
          <input className="coffee-input" placeholder="رقم الجوال (اختياري)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        )}
        <input className="coffee-input" type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="coffee-input" type="password" placeholder="كلمة المرور" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button className="action-btn" style={{ width: '100%', opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleSubmit}>
          {loading ? '⏳ جاري...' : (tab === 'login' ? 'تسجيل دخول' : 'إنشاء حساب')}
        </button>
        <button className="modal-close" onClick={closeModal} style={{ position: 'absolute', top: 14, left: 14 }}>✕</button>
      </div>
    </div>
  );
}
