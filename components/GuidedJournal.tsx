'use client';

import { useState, useRef, useEffect } from 'react';
import { saveGuidedSession } from '@/lib/supabase';

const PROMPTS = {
  stress_triggers: [
    "What triggered your stress today?",
    "Describe the moment that felt hardest.",
    "What was the main pressure point this week?",
  ],
  coping: [
    "How did you respond to that feeling?",
    "What did you do — or want to do — to cope?",
    "What strategy helped, even a little?",
  ],
  recovery: [
    "How are you feeling right now, in this moment?",
    "What would help you feel even 10% better?",
    "What rest or recovery have you given yourself?",
  ],
  social: [
    "Did anyone around you contribute to this feeling?",
    "How did your interactions shape your day?",
    "Who felt like an anchor today — or the opposite?",
  ],
  growth: [
    "What did you learn about yourself today?",
    "Is there a pattern here you've seen before?",
    "What would you tell yourself if this happens again?",
  ],
};

type Role = 'assistant' | 'user';
interface Message { role: Role; text: string; }

function pickPrompts(count = 5): string[] {
  const categories = Object.values(PROMPTS);
  const picked: string[] = [];
  let lastCat = -1;
  while (picked.length < count) {
    let catIdx: number;
    do { catIdx = Math.floor(Math.random() * categories.length); } while (catIdx === lastCat);
    const cat = categories[catIdx];
    const prompt = cat[Math.floor(Math.random() * cat.length)];
    if (!picked.includes(prompt)) { picked.push(prompt); lastCat = catIdx; }
  }
  return picked;
}

interface Props { onClose?: () => void; onSaved?: () => void; }

export default function GuidedJournal({ onClose, onSaved }: Props) {
  const [prompts] = useState<string[]>(() => pickPrompts(5));
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: prompts[0] },
  ]);
  const [input, setInput] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input.trim() };
    const nextIdx = promptIdx + 1;
    const newMessages = [...messages, userMsg];

    if (nextIdx < prompts.length) {
      newMessages.push({ role: 'assistant', text: prompts[nextIdx] });
      setPromptIdx(nextIdx);
    } else {
      setDone(true);
    }

    setMessages(newMessages);
    setInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    await saveGuidedSession(messages, true);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSaved?.(); onClose?.(); }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
        <div>
          <p className="text-xs text-warm-400 uppercase tracking-wide">Guided session</p>
          <p className="font-serif text-warm-800 text-base">
            {done ? 'Session complete' : `Question ${promptIdx + 1} of ${prompts.length}`}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-warm-400 hover:text-warm-700 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-warm-100">
        <div className="h-1 bg-sage transition-all duration-500"
          style={{ width: `${((promptIdx + (done ? 1 : 0)) / prompts.length) * 100}%` }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-white text-warm-800 shadow-card border border-warm-100 font-serif'
                : 'bg-sage text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {done && (
          <div className="text-center py-4">
            <p className="font-serif text-warm-600 text-base mb-1">You showed up for yourself today.</p>
            <p className="text-warm-400 text-xs">That matters more than you think.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-warm-100 px-5 py-4 bg-white">
        {!done ? (
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Write freely..."
              rows={2}
              className="flex-1 resize-none bg-cream rounded-2xl px-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300"
              autoFocus
            />
            <button onClick={handleSubmit} disabled={!input.trim()}
              className="w-11 h-11 bg-sage rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={handleSave} disabled={saving || saved}
            className="w-full py-3 bg-sage text-white rounded-2xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-40">
            {saved ? '✓ Session saved' : saving ? 'Saving...' : 'Save this session'}
          </button>
        )}
        {input.length > 10 && !done && (
          <p className="text-xs text-warm-300 text-right mt-1">{input.split(' ').filter(Boolean).length} words</p>
        )}
      </div>
    </div>
  );
}
