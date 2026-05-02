'use client';

import { useEffect } from 'react';
import type { Period } from '@/lib/usePeriod';

interface Props {
  open: boolean;
  period: Period;
  onClose: () => void;
  onTogglePeriod: () => void;
  onReset?: () => void;
}

const NAV_LINKS = [
  { href: '/',         label: 'Home',    icon: '🌙' },
  { href: '/journal',  label: 'Journal', icon: '📖' },
  { href: '/reflect',  label: 'Reflect', icon: '🌀' },
  { href: '/recover',  label: 'Recover', icon: '🌱' },
  { href: '/saved',    label: 'Saved',   icon: '🔖' },
];

export default function Drawer({ open, period, onClose, onTogglePeriod, onReset }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(7,16,31,0.6)', backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.35s cubic-bezier(0.4,0.1,0.2,1)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 70,
        width: 280,
        background: 'var(--bg, #07101F)',
        borderRight: '1px solid var(--line-strong, rgba(149,176,217,0.18))',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0.1,0.2,1)',
        paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}>

        {/* App name */}
        <div style={{ padding: '0 24px 32px' }}>
          <p style={{ fontFamily: 'var(--font-serif, Georgia)', fontSize: 22, fontWeight: 500, color: 'var(--text, #E6E1D7)', marginBottom: 2 }}>
            Psych Hub
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted, #8A8276)', fontStyle: 'italic', fontFamily: 'var(--font-serif, Georgia)' }}>
            your personal recovery space
          </p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                color: 'var(--ink, var(--text, #E6E1D7))', textDecoration: 'none',
                fontSize: 15, fontFamily: 'var(--font-sans, system-ui)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              {link.label}
            </a>
          ))}
          {onReset && (
            <button onClick={onReset}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, width: '100%',
                color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none',
                fontSize: 15, fontFamily: 'var(--font-sans, system-ui)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 18 }}>🔄</span>
              Check in again
            </button>
          )}
        </nav>

        {/* Day/Night toggle footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line, rgba(149,176,217,0.10))' }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim, #5C5750)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Appearance
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['night', 'day'] as Period[]).map(p => (
              <button key={p}
                onClick={() => onTogglePeriod()}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  fontSize: 13, fontWeight: 500,
                  fontFamily: 'var(--font-sans, system-ui)',
                  border: `1px solid ${period === p ? 'var(--accent, #95B0D9)' : 'var(--line, rgba(149,176,217,0.10))'}`,
                  background: period === p ? 'var(--surface-mid, rgba(149,176,217,0.08))' : 'transparent',
                  color: period === p ? 'var(--accent, #95B0D9)' : 'var(--text-muted, #8A8276)',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}>
                {p === 'night' ? '🌙 Night' : '☀️ Day'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim, #5C5750)', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
            {period === 'night' ? 'auto-switches at 6am' : 'auto-switches at 6pm'}
          </p>
        </div>
      </div>
    </>
  );
}
