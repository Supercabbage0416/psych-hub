'use client';

import { useState, useRef, useEffect } from 'react';
import { saveChatSession } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  source: string;
  initialContext?: string;
}

export default function AIChatDrawer({ open, onClose, source, initialContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [summary, setSummary] = useState<{ bullets: string[]; next_step: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput('');
      setSummary(null);
      setSaved(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function summarise() {
    if (messages.length < 2 || summarising) return;
    setSummarising(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: 'summary' }),
      });
      const data = await res.json();
      if (data.bullets) setSummary(data);
    } catch { /* ignore */ } finally { setSummarising(false); }
  }

  async function handleClose() {
    if (messages.length >= 2 && !saved) {
      const summaryStr = summary ? JSON.stringify(summary) : undefined;
      await saveChatSession(messages, source, summaryStr).catch(() => {});
      setSaved(true);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 55,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: 'var(--bg, #0d1424)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        display: 'flex', flexDirection: 'column',
        height: '85svh',
        animation: 'slideUpChat 0.28s cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>✦ AI Chat</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {messages.length >= 2 && (
              <button onClick={summarise} disabled={summarising} style={{
                fontSize: 11, padding: '5px 12px', borderRadius: 999,
                background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.25)',
                color: 'var(--accent, #7aa6ff)', cursor: summarising ? 'default' : 'pointer',
              }}>
                {summarising ? '...' : '✦ Summarise'}
              </button>
            )}
            <button onClick={handleClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ink-2, #a8b4cf)', fontSize: 18,
            }}>×</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 20 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 20, color: 'var(--ink-3, #6b789a)' }}>
                What&apos;s on your mind?
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', marginTop: 6 }}>
                I&apos;ll listen — no judgment, no agenda.
              </p>
              {initialContext && (
                <button onClick={() => send(initialContext)} style={{
                  marginTop: 20, padding: '10px 20px', borderRadius: 999, fontSize: 13,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--ink-2, #a8b4cf)', cursor: 'pointer', maxWidth: 280,
                  fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                  lineHeight: 1.4, textAlign: 'center',
                }}>
                  &ldquo;{initialContext.slice(0, 80)}{initialContext.length > 80 ? '...' : ''}&rdquo;
                </button>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%', padding: '10px 14px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? 'rgba(122,166,255,0.14)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.role === 'user' ? 'rgba(122,166,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                color: 'var(--ink, #e8eef9)', fontSize: 14, lineHeight: 1.65,
                fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: 'var(--ink-3, #6b789a)', letterSpacing: 4, fontSize: 16 }}>···</span>
              </div>
            </div>
          )}

          {summary && (
            <div style={{ borderRadius: 16, padding: '14px 16px', background: 'rgba(122,166,255,0.07)', border: '1px solid rgba(122,166,255,0.2)', marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #7aa6ff)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>✦ Chat Summary</p>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {summary.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.65, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{b}</li>
                ))}
              </ul>
              {summary.next_step && (
                <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink, #e8eef9)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>
                  → {summary.next_step}
                </p>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '8px 16px calc(env(safe-area-inset-bottom) + 16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          flexShrink: 0,
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Share what's on your mind..."
            rows={1}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '10px 14px',
              fontSize: 14, color: 'var(--ink, #e8eef9)',
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              lineHeight: 1.5, resize: 'none', outline: 'none',
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: input.trim() ? 'rgba(122,166,255,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${input.trim() ? 'rgba(122,166,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: input.trim() ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
            transition: 'all 0.15s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpChat {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
