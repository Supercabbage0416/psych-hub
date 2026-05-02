'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #0d1424)',
      padding: '0 24px',
    }}>
      {/* Logo / name */}
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
        {status === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 16 }}>✉️</p>
            <p style={{
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              fontSize: 20, fontWeight: 500, color: 'var(--ink, #e8eef9)',
              marginBottom: 10,
            }}>
              Check your email
            </p>
            <p style={{ fontSize: 14, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.6 }}>
              We sent a sign-in link to <strong style={{ color: 'var(--ink, #e8eef9)' }}>{email}</strong>.
              Click it to continue — no password needed.
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                marginTop: 24, fontSize: 13, color: 'var(--ink-3, #6b789a)',
                background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline',
              }}>
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)',
              marginBottom: 6,
            }}>
              Sign in
            </p>
            <p style={{
              fontSize: 13, color: 'var(--ink-2, #a8b4cf)',
              marginBottom: 24, lineHeight: 1.5,
            }}>
              Enter your email and we&apos;ll send you a magic link.
            </p>

            <label style={{
              display: 'block', fontSize: 11, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)',
              marginBottom: 8,
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, fontSize: 15,
                color: 'var(--ink, #e8eef9)',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                marginBottom: 16,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(122,166,255,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />

            {status === 'error' && (
              <p style={{ fontSize: 13, color: '#ff6b6b', marginBottom: 12 }}>
                {errorMsg || 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              style={{
                width: '100%', padding: '14px 0',
                borderRadius: 999, fontSize: 15, fontWeight: 600,
                fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                background: 'rgba(122,166,255,0.12)',
                border: '1px solid rgba(122,166,255,0.3)',
                color: 'var(--accent, #7aa6ff)',
                cursor: status === 'sending' ? 'default' : 'pointer',
                opacity: (!email.trim() || status === 'sending') ? 0.6 : 1,
                transition: 'all 0.2s',
              }}>
              {status === 'sending' ? 'Sending...' : 'Send magic link →'}
            </button>
          </form>
        )}
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
