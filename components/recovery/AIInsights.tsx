'use client';

import { useState } from 'react';
import type { RecoveryState, DailyRecord } from '@/lib/recovery/types';
import { getStage } from '@/lib/recovery/config';

interface Insight {
  themes: string[];
  working: string;
  challenging: string;
  growth: string;
  suggestion: string;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string; active: string }> = {
  stabilization: { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',  active: 'bg-blue-500' },
  competence:    { bg: 'bg-sage-pale',  text: 'text-sage',       border: 'border-sage-light',active: 'bg-sage' },
  autonomy:      { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200', active: 'bg-amber-500' },
  social:        { bg: 'bg-rose-pale',  text: 'text-rose',       border: 'border-rose-light',active: 'bg-rose' },
  meaning:       { bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-200',active: 'bg-purple-500' },
};

function formatRecordsForAI(records: DailyRecord[]): string {
  return records.map(r => {
    const lines = [`Date: ${r.date}`, `Completion: ${r.completion}`, `Energy: ${r.energy}`];
    const textEntries = Object.entries(r.reflections)
      .filter(([key, val]) => val && val.length > 3 && !['completion', 'energy', 'effectiveness'].includes(key));
    textEntries.forEach(([key, val]) => lines.push(`${key}: ${val}`));
    return lines.join(' | ');
  }).join('\n');
}

interface Props {
  state: RecoveryState;
}

export default function AIInsights({ state }: Props) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const stage = getStage(state.currentStage);
  const colors = STAGE_COLORS[state.currentStage];

  const today = new Date().toISOString().split('T')[0];
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const recentRecords = state.records
    .filter(r => r.date >= cutoff && r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasEnoughData = recentRecords.length >= 3;

  const stageStart = new Date(state.stageStartDate);
  const daysInStage = Math.floor((new Date().getTime() - stageStart.getTime()) / 86400000) + 1;

  async function generateInsights() {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey) {
      setError('DeepSeek API key not configured.');
      return;
    }

    setLoading(true);
    setError(null);

    const recordSummary = formatRecordsForAI(recentRecords);
    const completionCounts = recentRecords.reduce<Record<string, number>>((acc, r) => {
      acc[r.completion] = (acc[r.completion] ?? 0) + 1;
      return acc;
    }, {});
    const energyCounts = recentRecords.reduce<Record<string, number>>((acc, r) => {
      acc[r.energy] = (acc[r.energy] ?? 0) + 1;
      return acc;
    }, {});

    const prompt = `You are a gentle, non-judgmental behavioral coach reviewing someone's private personal recovery journal.

Context:
- Current recovery stage: ${stage.name} — ${stage.tagline}
- Days in this stage: ${daysInStage}
- Records analyzed: last ${recentRecords.length} days

Completion breakdown: ${JSON.stringify(completionCounts)}
Energy breakdown: ${JSON.stringify(energyCounts)}

Their personal reflections (private):
${recordSummary}

Based only on what you observe above, provide a warm and honest behavioral analysis:
1. themes: 2-3 recurring emotional or behavioral patterns you genuinely notice (be specific, not generic)
2. working: what seems to be going well or building momentum, even subtly
3. challenging: what seems to be most difficult or draining, based on patterns
4. growth: one specific, honest observation about change or progress — even if small
5. suggestion: one gentle, concrete suggestion for the next 7 days — something small and actionable

Important: Be specific to their actual reflections. Avoid clinical language. Do not diagnose. Keep tone warm and human.

Respond ONLY in valid JSON with no markdown:
{"themes": ["...", "..."], "working": "...", "challenging": "...", "growth": "...", "suggestion": "..."}`;

    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
          temperature: 0.4,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/```json\n?|\n?```/g, '');
      const parsed: Insight = JSON.parse(text);
      setInsight(parsed);
      setLastGenerated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError('Could not generate insights right now. Try again in a moment.');
      console.error('AIInsights error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (!hasEnoughData) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-card border border-warm-100 text-center">
        <p className="font-serif text-xl text-warm-700 mb-2">Not enough data yet</p>
        <p className="text-warm-400 text-sm leading-relaxed">
          Complete at least 3 daily reflections and AI will be able to analyze your patterns.
          You have {recentRecords.length} so far.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${colors.bg} border ${colors.border} rounded-3xl p-5`}>
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">AI Pattern Analysis</p>
        <h2 className="font-serif text-2xl text-warm-900">Your patterns</h2>
        <p className={`text-sm ${colors.text} mt-0.5`}>
          Based on {recentRecords.length} reflections · {stage.name} stage
        </p>
      </div>

      {/* Generate button */}
      {!insight && !loading && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-sm text-warm-600 leading-relaxed mb-4">
            DeepSeek will read your private reflections and identify behavioral patterns,
            what is working, what is hard, and one gentle suggestion.
          </p>
          <p className="text-xs text-warm-300 mb-4">
            Your reflections are sent to DeepSeek for analysis. They are not stored anywhere except your own Supabase.
          </p>
          <button
            onClick={generateInsights}
            className={`w-full py-3.5 rounded-2xl ${colors.active} text-white text-sm font-medium active:scale-[0.98] transition-transform`}
          >
            Analyze my patterns
          </button>
          {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 shadow-card border border-warm-100 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Reading your reflections...</p>
          <p className="text-warm-300 text-xs mt-1">This takes a few seconds</p>
        </div>
      )}

      {/* Results */}
      {insight && !loading && (
        <>
          {/* Themes */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
            <p className="text-xs text-warm-400 uppercase tracking-wide mb-3">Patterns noticed</p>
            <div className="space-y-2">
              {insight.themes.map((theme, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.active} mt-1.5 flex-shrink-0`} />
                  <p className="text-warm-700 text-sm leading-relaxed">{theme}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's working */}
          <div className="bg-sage-pale border border-sage-light rounded-3xl p-5">
            <p className="text-xs font-semibold text-sage uppercase tracking-wide mb-2">What seems to be working</p>
            <p className="text-warm-700 text-sm leading-relaxed">{insight.working}</p>
          </div>

          {/* What's hard */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">What still feels difficult</p>
            <p className="text-warm-700 text-sm leading-relaxed">{insight.challenging}</p>
          </div>

          {/* Growth observation */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
            <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">Growth observation</p>
            <p className="text-warm-700 text-sm leading-relaxed italic">"{insight.growth}"</p>
          </div>

          {/* Suggestion */}
          <div className={`${colors.bg} border ${colors.border} rounded-3xl p-5`}>
            <p className={`text-xs font-semibold ${colors.text} uppercase tracking-wide mb-2`}>One suggestion for this week</p>
            <p className="text-warm-700 text-sm leading-relaxed">{insight.suggestion}</p>
          </div>

          {/* Regenerate */}
          <div className="flex items-center justify-between px-1">
            {lastGenerated && (
              <p className="text-xs text-warm-300">Generated at {lastGenerated}</p>
            )}
            <button
              onClick={generateInsights}
              className="text-xs text-warm-400 underline underline-offset-2 ml-auto"
            >
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
}
