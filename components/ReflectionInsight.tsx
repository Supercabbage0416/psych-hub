'use client';

import { useState, useRef, useEffect } from 'react';
import { getMoodHistory, getJournalEntries, getReflections, saveReflectionInsight, getLatestInsight } from '@/lib/supabase';
import { loadState } from '@/lib/recovery/storage';

interface Insight {
  mood: string;
  motivation: string;
  status: string;
  recommendation: string;
  reasoning: string;
}

interface ThreadMessage {
  role: 'ai' | 'user';
  content: string;
}

interface SavedInsight {
  id: string;
  mood: string;
  motivation: string;
  status: string;
  recommendation: string;
  reasoning: string;
  thread: ThreadMessage[];
  created_at: string;
}

export default function ReflectionInsight() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [savedInsight, setSavedInsight] = useState<SavedInsight | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLatestInsight().then(data => {
      if (data) {
        const saved = data as SavedInsight;
        setSavedInsight(saved);
        setInsight({
          mood: saved.mood,
          motivation: saved.motivation,
          status: saved.status,
          recommendation: saved.recommendation,
          reasoning: saved.reasoning,
        });
        setThread(saved.thread ?? []);
        setGeneratedAt(saved.created_at?.slice(0, 10));

        // Auto-refresh if last insight is more than 3 days old
        const daysSince = (Date.now() - new Date(saved.created_at).getTime()) / 86400000;
        if (daysSince > 3) generateInsight();
      } else {
        // No insight yet — auto-generate
        generateInsight();
      }
    }).catch(() => { generateInsight(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function generateInsight() {
    setLoading(true);
    setError(null);
    try {
      const [moods, journals, reflections] = await Promise.all([
        getMoodHistory(14),
        getJournalEntries(),
        getReflections(),
      ]);

      // Pre-flight data checks
      if ((moods as unknown[]).length < 3 && (journals as unknown[]).length < 2) {
        setError('Not enough data yet. Add at least 3 mood check-ins or 2 journal entries to get a weekly read.');
        setLoading(false);
        return;
      }
      if ((moods as unknown[]).length < 3) {
        setError('Add at least 3 mood check-ins this week so the AI has enough signal to work with.');
        setLoading(false);
        return;
      }

      const recoveryState = loadState();
      const stage = getStageLabel(recoveryState.currentStage);
      const recoveryRecords = recoveryState.records
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14);

      const res = await fetch('/api/reflect-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          journals: (journals as unknown[]).slice(0, 10),
          moods: moods,
          weeklyReflections: (reflections as unknown[]).slice(0, 2),
          recoveryRecords,
          recoveryStage: stage,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 402 || errText.includes('balance') || errText.includes('credit')) {
          throw new Error('AI service temporarily unavailable. Try again later.');
        }
        if (res.status >= 500) {
          throw new Error('Server error. Try again in a moment.');
        }
        throw new Error(`Request failed (${res.status})`);
      }
      const data: Insight = await res.json();

      setInsight(data);
      setThread([{ role: 'ai', content: data.recommendation }]);
      setGeneratedAt(new Date().toISOString().slice(0, 10));

      // Save to Supabase
      const saved = await saveReflectionInsight({
        mood: data.mood,
        motivation: data.motivation,
        status: data.status,
        recommendation: data.recommendation,
        reasoning: data.reasoning,
        thread: [{ role: 'ai', content: data.recommendation }],
      });
      if (saved) setSavedInsight(saved as SavedInsight);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('Connection failed. Check your internet and try again.');
      } else {
        setError(msg);
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function sendComment() {
    if (!comment.trim() || !insight) return;
    const userMsg: ThreadMessage = { role: 'user', content: comment.trim() };
    const newThread = [...thread, userMsg];
    setThread(newThread);
    setComment('');
    setResponding(true);

    try {
      const res = await fetch('/api/reflect-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'respond',
          thread: newThread,
          userComment: userMsg.content,
          mood: insight.mood,
          motivation: insight.motivation,
          status: insight.status,
          recommendation: insight.recommendation,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const aiMsg: ThreadMessage = { role: 'ai', content: data.response };
      const fullThread = [...newThread, aiMsg];
      setThread(fullThread);

      // Update Supabase thread
      if (savedInsight?.id) {
        await updateInsightThread(savedInsight.id, fullThread);
      }
    } catch {
      setThread(t => [...t, { role: 'ai', content: 'Something went wrong. Try again in a moment.' }]);
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">AI Coach</p>
        <h2 className="font-serif text-2xl text-warm-900">Your weekly read</h2>
        <p className="text-warm-400 text-sm mt-1 leading-snug">
          Based on your moods, journals, reflections, and recovery data.
        </p>
        {generatedAt && (
          <p className="text-xs text-warm-300 mt-2">Last generated: {generatedAt}</p>
        )}
      </div>

      {/* Extracted signals */}
      {insight && (
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-2xl px-4 py-3.5 border border-warm-100 shadow-card">
            <p className="text-xs text-warm-300 uppercase tracking-wide mb-1">Mood right now</p>
            <p className="text-warm-800 font-medium text-sm">{insight.mood}</p>
          </div>
          <div className="bg-white rounded-2xl px-4 py-3.5 border border-warm-100 shadow-card">
            <p className="text-xs text-warm-300 uppercase tracking-wide mb-1">Core motivation / block</p>
            <p className="text-warm-800 text-sm leading-relaxed">{insight.motivation}</p>
          </div>
          <div className="bg-sage-pale border border-sage-light rounded-2xl px-4 py-3.5">
            <p className="text-xs text-sage uppercase tracking-wide mb-1">Where you are</p>
            <p className="text-warm-700 text-sm leading-relaxed">{insight.status}</p>
          </div>
        </div>
      )}

      {/* Recommendation + conversation thread */}
      {insight && thread.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">This week's plan</p>

          {/* Why this recommendation */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-700 leading-relaxed">{insight.reasoning}</p>
          </div>

          {/* Thread */}
          <div className="space-y-3 mb-4">
            {thread.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-cream border border-warm-100 text-warm-800 font-serif'
                    : 'bg-sage text-white'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {responding && (
              <div className="flex justify-start">
                <div className="bg-cream border border-warm-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-warm-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Comment input */}
          <div className="border-t border-warm-100 pt-4">
            <p className="text-xs text-warm-400 mb-2">Push back, ask, or refine the plan</p>
            <div className="flex gap-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); }}}
                placeholder="e.g. That feels too much for this week…"
                rows={2}
                className="flex-1 bg-warm-50 border border-warm-100 rounded-2xl px-3 py-2.5 text-sm text-warm-800 placeholder-warm-300 resize-none focus:outline-none focus:border-warm-300"
              />
              <button
                onClick={sendComment}
                disabled={!comment.trim() || responding}
                className="self-end px-4 py-2.5 bg-sage text-white rounded-2xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state (shown when not loading and no insight) */}
      {!insight && !loading && error && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-sm text-warm-500 leading-relaxed mb-3">{error}</p>
          <button
            onClick={generateInsight}
            className="w-full py-3 rounded-2xl bg-sage text-white text-sm font-medium active:scale-[0.98] transition-transform"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 shadow-card border border-warm-100 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Reading your reflections...</p>
          <p className="text-warm-300 text-xs mt-1">Mood, journals, recovery data</p>
        </div>
      )}

      {/* Regenerate */}
      {insight && !loading && (
        <div>
          {error && <p className="text-xs text-red-400 mb-2 text-center px-1">{error}</p>}
          <button
            onClick={generateInsight}
            className="w-full py-3 rounded-2xl border border-warm-100 bg-white text-xs text-warm-400"
          >
            Refresh with latest data
          </button>
        </div>
      )}
    </div>
  );
}

function getStageLabel(id: string): string {
  const labels: Record<string, string> = {
    stabilization: 'Stage 1: Stabilization',
    competence: 'Stage 2: Competence',
    autonomy: 'Stage 3: Autonomy',
    social: 'Stage 4: Social Safety',
    meaning: 'Stage 5: Meaning',
  };
  return labels[id] ?? id;
}

async function updateInsightThread(id: string, thread: ThreadMessage[]) {
  try {
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('reflection_insights').update({ thread }).eq('id', id);
  } catch {}
}
