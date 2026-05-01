'use client';

import { useEffect, useState } from 'react';
import { getThisWeekReflection, getReflections, saveReflection, getMoodHistory, getJournalEntries } from '@/lib/supabase';
import { getWeeklyObservationPrompt } from '@/lib/prompts';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import GuidedJournal from '@/components/GuidedJournal';
import ReflectWithAI from '@/components/ReflectWithAI';
import ReflectionInsight from '@/components/ReflectionInsight';

interface Reflection {
  id: string;
  content: string;
  observation: string;
  week_number: number;
  year: number;
  created_at: string;
}

export default function ReflectPage() {
  const [thisWeek, setThisWeek] = useState<Reflection | null>(null);
  const [past, setPast] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekContext, setWeekContext] = useState('');
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'guided' | 'ai'>('weekly');
  const [showGuided, setShowGuided] = useState(false);
  const observationPrompt = getWeeklyObservationPrompt();

  useEffect(() => {
    Promise.all([
      getThisWeekReflection(),
      getReflections(),
      getMoodHistory(7),
      getJournalEntries(),
    ]).then(([current, all, moods, entries]) => {
      setThisWeek(current as Reflection | null);
      if (current) {
        setContent((current as Reflection).content ?? '');
        setObservation((current as Reflection).observation ?? '');
      }
      setPast((all as Reflection[]).slice(0, 5));

      const moodSummary = (moods as { mood: string }[]).map((m) => m.mood).join(', ');
      const thoughtSummary = (entries as { content: string }[]).slice(0, 5).map((e) => `"${e.content}"`).join('\n');
      setWeekContext(
        `This week my moods were: ${moodSummary || 'not recorded'}.\n\nMy thoughts this week:\n${thoughtSummary || 'none yet'}`
      );
      setLoading(false);
    });
  }, []);

  const aiPrompt = `Here is my weekly reflection:\n\n${content}\n\nMy observation: ${observation}\n\n${weekContext}\n\nHelp me find connections, patterns, and one gentle insight I might carry forward.`;

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await saveReflection(content.trim(), observation.trim());
    setSaving(false);
    setSaved(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 animate-fade-in pb-8">
      <div className="mb-5">
        <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your space</p>
        <h1 className="font-serif text-3xl text-warm-900">Reflect</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl mb-6">
        {(['weekly', 'monthly', 'guided', 'ai'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-xl capitalize transition-all ${
              activeTab === tab ? 'bg-white text-warm-800 shadow-card' : 'text-warm-400'}`}>
            {tab === 'guided' ? '🌿 Guided' : tab === 'monthly' ? '📅 Monthly' : tab === 'ai' ? '✨ AI' : '🌙 Weekly'}
          </button>
        ))}
      </div>

      {/* Guided journal */}
      {activeTab === 'guided' && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100 mb-6">
          <p className="text-sm font-medium text-warm-700 mb-1">Guided reflection session</p>
          <p className="text-xs text-warm-400 mb-4">A gentle conversation with yourself — 5 psychology-based prompts.</p>
          <button onClick={() => setShowGuided(true)}
            className="w-full py-3 bg-sage text-white rounded-2xl text-sm font-medium active:scale-95 transition-transform">
            Start session
          </button>
        </div>
      )}

      {/* AI insight */}
      {activeTab === 'ai' && <ReflectionInsight />}

      {/* Monthly calendar */}
      {activeTab === 'monthly' && <MonthlyCalendar />}

      {/* Weekly reflection */}
      {activeTab === 'weekly' && (
      <div>
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🌙</span>
          <p className="text-sm font-medium text-warm-700">This week</p>
          {saved && <span className="ml-auto text-xs text-sage">✓ Saved</span>}
        </div>

        <p className="text-xs text-warm-400 mb-1.5">What did you learn or notice this week?</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Any patterns, surprises, shifts — big or small..."
          className="w-full min-h-[100px] resize-none bg-cream rounded-2xl p-3.5 text-warm-800 text-sm leading-relaxed placeholder:text-warm-300 border border-warm-100 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage transition-colors mb-4"
        />

        <p className="text-xs text-warm-400 mb-1.5 font-serif italic">{observationPrompt}</p>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Write one honest observation..."
          className="w-full min-h-[80px] resize-none bg-cream rounded-2xl p-3.5 text-warm-800 text-sm leading-relaxed placeholder:text-warm-300 border border-warm-100 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage transition-colors mb-4"
        />

        <div className="flex items-center justify-between">
          <ReflectWithAI context={aiPrompt} label="Reflect with AI" />
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="px-5 py-2.5 bg-sage text-white rounded-2xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save reflection'}
          </button>
        </div>
      </div>

      {/* Past reflections */}
      {activeTab === 'weekly' && past.filter((r) => thisWeek ? r.id !== thisWeek.id : true).length > 0 && (
        <div>
          <p className="text-sm font-medium text-warm-500 mb-3">Previous weeks</p>
          <div className="space-y-4">
            {past
              .filter((r) => (thisWeek ? r.id !== thisWeek.id : true))
              .map((r) => (
                <div key={r.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
                  <p className="text-xs text-warm-300 mb-2">Week {r.week_number}, {r.year}</p>
                  <p className="text-warm-700 text-sm leading-relaxed mb-2">{r.content}</p>
                  {r.observation && (
                    <p className="text-warm-400 text-xs italic border-t border-warm-100 pt-2 mt-2">
                      "{r.observation}"
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {past.length === 0 && !thisWeek && (
        <div className="text-center py-12">
          <p className="font-serif text-xl text-warm-300 mb-2">Your first reflection</p>
          <p className="text-warm-400 text-sm">Take a moment to look back at this week.</p>
        </div>
      )}
      </div>
      )}

      {showGuided && (
        <GuidedJournal onClose={() => setShowGuided(false)} onSaved={() => setShowGuided(false)} />
      )}
    </div>
  );
}
