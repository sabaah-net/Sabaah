'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../i18n';
import { useToast } from '../shared/Toast';

const COFFEE_TYPES: Record<string, string> = {
  'سوداء': 'black', 'سودا': 'black',
  'بيضاء': 'white', 'بيضا': 'white',
  'مثلجة': 'iced', 'مثلجه': 'iced', 'مثلج': 'iced', 'باردة': 'iced',
  'إسباني': 'spanish', 'اسباني': 'spanish',
  'تركية': 'turkish', 'تركي': 'turkish',
  'موكا': 'mocha',
};

const CAFE_LOOKUP: Record<string, string> = {
  'برو92': 'Brew92', 'برو 92': 'Brew92', 'brew92': 'Brew92',
  'قهوة السعودية': 'قهوة السعودية', 'السعودية': 'قهوة السعودية',
  'إيليفن': 'إيليفن', 'ايليفن': 'إيليفن', 'eleven': 'إيليفن', 'اليفن': 'إيليفن',
  'المختصة': 'المختصة', 'مختصة': 'المختصة',
};

const PRICES: Record<string, number> = { black: 7, white: 7, iced: 7, spanish: 9, turkish: 8, mocha: 10 };
const ICONS: Record<string, string> = { black: '☕', white: '🥛', iced: '🧊', spanish: '🍯', turkish: '🫖', mocha: '🍫' };

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface MatchResult {
  cafe?: string;
  coffee?: string;
}

export default function VoiceModal() {
  const store = useAppStore();
  const { show } = useToast();
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const manualStopRef = useRef(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [match, setMatch] = useState<MatchResult>({});

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const resetState = () => {
    setTranscript('');
    transcriptRef.current = '';
    setErrorMsg('');
    setMatch({});
    setStatus('idle');
    manualStopRef.current = false;
  };

  const close = () => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    document.getElementById('voiceModal')?.classList.remove('open');
    setTimeout(resetState, 300);
  };

  const processTranscript = useCallback((text: string) => {
    setStatus('processing');
    const normalized = text.trim().toLowerCase();
    let matchedCafe: string | null = null;
    let matchedCafeObj: any = null;

    for (const [keyword, name] of Object.entries(CAFE_LOOKUP)) {
      if (normalized.includes(keyword.toLowerCase())) {
        matchedCafe = name;
        matchedCafeObj = store.cafes.find(c => c.name === name || c.nameEn === name);
        break;
      }
    }

    let matchedCoffee: string | null = null;
    for (const [keyword, type] of Object.entries(COFFEE_TYPES)) {
      if (normalized.includes(keyword)) {
        matchedCoffee = type;
        break;
      }
    }

    const found: MatchResult = {};
    if (matchedCafe) found.cafe = matchedCafe;
    if (matchedCoffee) found.coffee = matchedCoffee;
    setMatch(found);

    if (matchedCafe && matchedCafeObj) {
      store.setSelectedCafe(matchedCafeObj);
      show(`✅ ${matchedCafe}`, 'success');
    }

    if (matchedCoffee) {
      const existing = store.cart.find(item => item.type === matchedCoffee);
      if (existing) {
        store.setCart(store.cart.map(item =>
          item.type === matchedCoffee ? { ...item, qty: item.qty + 1 } : item
        ));
      } else {
        store.setCart([...store.cart, {
          type: matchedCoffee,
          qty: 1,
          price: PRICES[matchedCoffee] || 7,
          name: t(matchedCoffee as any, store.lang),
          icon: ICONS[matchedCoffee] || '☕',
        }]);
      }
      show(`✅ ${t(matchedCoffee as any, store.lang)}`, 'success');
    }

    setStatus(matchedCafe || matchedCoffee ? 'success' : 'error');
    if (!matchedCafe && !matchedCoffee) {
      setErrorMsg('لم نتمكن من التعرف على المقهى أو نوع القهوة');
    }
  }, [store, show]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    resetState();
    manualStopRef.current = false;

    const recognition = new SR();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setTranscript(finalText);
      transcriptRef.current = finalText;
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setErrorMsg('لم يتم التعرف على صوت');
      } else if (event.error === 'aborted') {
        return;
      } else {
        setErrorMsg('حدث خطأ في التعرف على الصوت');
      }
      setStatus('error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      const text = transcriptRef.current;
      if (text && text.trim()) {
        processTranscript(text);
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setStatus('listening');
  }, [processTranscript]);

  const stopListening = () => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    const text = transcriptRef.current;
    if (text && text.trim()) {
      processTranscript(text);
    } else {
      setStatus('idle');
    }
  };

  const suggestions = store.cafes.slice(0, 3).map(c => {
    const types = ['سوداء', 'بيضاء', 'مثلجة', 'إسباني'];
    return `"${c.name} ${types[Math.floor(Math.random() * types.length)]}"`;
  });

  return (
    <div className="modal-overlay" id="voiceModal" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={close} style={{ position: 'absolute', left: 18, top: 22, fontSize: '1.2rem' }}>✕</button>
        <div className="modal-title">🎙️ {t('voice_order', store.lang)}</div>

        {!isSupported ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🚫</div>
            <div style={{ fontWeight: 700, color: 'var(--red)' }}>{store.lang === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت' : 'Browser does not support speech recognition'}</div>
          </div>
        ) : status === 'idle' || status === 'listening' ? (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button
                className="voice-btn"
                onClick={isListening ? stopListening : startListening}
                style={{ animationDuration: isListening ? '1s' : '2s', background: isListening ? 'var(--red)' : 'var(--amber)' }}
              >
                🎙️
              </button>
            </div>

            {isListening && (
              <div className="voice-wave">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="voice-bar" />)}
              </div>
            )}

            <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-mid)', margin: '10px 0', fontSize: '.9rem' }}>
              {isListening
                ? (store.lang === 'ar' ? 'استمع... تحدث الآن' : 'Listening... speak now')
                : (store.lang === 'ar' ? 'اضغط على الميكروفون وقل طلبك' : 'Tap the mic and say your order')}
            </div>

            {transcript && (
              <div style={{
                background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: 12, margin: '10px 0',
                textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--bark)',
              }}>
                {transcript}
              </div>
            )}
          </>
        ) : status === 'processing' ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
            <div style={{ fontWeight: 700 }}>{store.lang === 'ar' ? 'جاري معالجة طلبك...' : 'Processing your order...'}</div>
          </div>
        ) : status === 'success' ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 10 }}>
              {store.lang === 'ar' ? 'تم التعرف على طلبك!' : 'Order recognized!'}
            </div>
            {match.cafe && <div style={{ fontSize: '.9rem', marginBottom: 5 }}>☕ {store.lang === 'ar' ? 'المقهى' : 'Cafe'}: {match.cafe}</div>}
            {match.coffee && <div style={{ fontSize: '.9rem', marginBottom: 15 }}>🥤 {store.lang === 'ar' ? 'القهوة' : 'Coffee'}: {t(match.coffee as any, store.lang)}</div>}
            <button className="action-btn" onClick={close}>{store.lang === 'ar' ? 'حسناً' : 'OK'}</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>❌</div>
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>{errorMsg}</div>
            <div style={{ fontSize: '.82rem', color: 'var(--text-light)', marginBottom: 15 }}>
              {store.lang === 'ar' ? 'مثال: "برو92 قهوة سوداء"' : 'Example: "Brew92 black coffee"'}
            </div>
            <button className="action-btn" style={{ background: 'var(--blue)' }} onClick={startListening}>
              🔄 {store.lang === 'ar' ? 'حاول مرة أخرى' : 'Try again'}
            </button>
          </div>
        )}

        <div style={{
          marginTop: 16, padding: '12px', borderRadius: 'var(--r-sm)',
          background: 'var(--latte)', fontSize: '.72rem', color: 'var(--text-light)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            💡 {store.lang === 'ar' ? 'قل مثلاً:' : 'Say something like:'}
          </div>
          {suggestions.map((s, i) => <div key={i} style={{ marginBottom: 2, direction: 'rtl' }}>• {s}</div>)}
        </div>
      </div>
    </div>
  );
}
