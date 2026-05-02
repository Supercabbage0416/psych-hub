'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setErrorMsg('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { setErrorMsg(error.message); setLoading(false); return; }
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #0d1424)',
      padding: '0 24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
          fontSize: 32, fontWeight: 500, color: 'var(--ink, #e8eef9)',
          letterSpacing: '0.02em', marginBottom: 6,
        }}>
          Psych Hub
        </p>
        <p style={{
          fontSize: 13, color: 'var(--ink-2, #a8b4cf)',
          fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
          fontStyle: 'italic',
        }}>
          your personal recovery space
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '32px 28px',
      }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {(['signin', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setErrorMsg(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 14, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'rgba(122,166,255,0.15)' : 'transparent',
                color: mode === m ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
              }}>
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoFocus
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 14,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, fontSize: 15, color: 'var(--ink, #e8eef9)',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(122,166,255,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          />

          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Choose a password' : 'Your password'}
            required minLength={6}
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, fontSize: 15, color: 'var(--ink, #e8eef9)',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(122,166,255,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          />
          {mode === 'signup' && (
            <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 16 }}>
              At least 6 characters
            </p>
          )}

          {errorMsg && (
            <p style={{ fontSize: 13, color: '#ff6b6b', marginBottom: 14, marginTop: 6 }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit" disabled={loading || !email.trim() || !password}
            style={{
              width: '100%', padding: '14px 0', marginTop: 8,
              borderRadius: 999, fontSize: 15, fontWeight: 600,
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              background: 'rgba(122,166,255,0.12)', border: '1px solid rgba(122,166,255,0.3)',
              color: 'var(--accent, #7aa6ff)',
              cursor: loading ? 'default' : 'pointer',
              opacity: (loading || !email.trim() || !password) ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
            {loading ? '...' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
          </button>
        </form>
      </div>

      <p style={{
        marginTop: 32, fontSize: 12, color: 'var(--ink-3, #6b789a)',
        textAlign: 'center', maxWidth: 280, lineHeight: 1.6,
        fontStyle: 'italic',
        fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
      }}>
        Your reflections are private. We never share your data.
      </p>
    </div>
  );
}
