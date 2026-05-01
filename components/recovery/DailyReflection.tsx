'use client';

import { useState } from 'react';
import type { RecoveryState, DailyRecord, Completion, EnergyLevel } from '@/lib/recovery/types';
import { getStage } from '@/lib/recovery/config';
import { calcActionScore, calcEffectivenessScore, getRandomFeedback, getTodayNudge } from '@/lib/recovery/scoring';
import { addDailyRecord, saveState, getTodayRecord } from '@/lib/recovery/storage';

const STAGE_COLORS: Record<string, { active: string; bar: string }> = {
  stabilization: { active: 'bg-blue-500',   bar: 'bg-blue-100' },
  competence:    { active: 'bg-sage',        bar: 'bg-sage-pale' },
  autonomy:      { active: 'bg-amber-500',   bar: 'bg-amber-50' },
  social:        { active: 'bg-rose',        bar: 'bg-rose-pale' },
  meaning:       { active: 'bg-purple-500',  bar: 'bg-purple-50' },
};

interface Props {
  state: RecoveryState;
  onStateChange: (s: RecoveryState) => void;
  onClose: () => void;
}

export default function DailyReflection({ state, onStateChange, onClose }: Props) {
  const stage = getStage(state.currentStage);
  const colors = STAGE_COLORS[state.currentStage];
  const nudge = getTodayNudge(state);
  const existingRecord = getTodayRecord(state);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(existingRecord?.reflections ?? {});
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState('');

  const questions = stage.reflectionQuestions;
  const total = questions.length;
  const current = questions[step];
  const progress = Math.round(((step) / total) * 100);

  const answer = answers[current?.id ?? ''] ?? '';

  const canAdvance = current?.type === 'text' ? true : answer !== '';

  function handleOption(value: string) {
    setAnswers(prev => ({ ...prev, [current.id]: value }));
  }

  function handleText(value: string) {
    setAnswers(prev => ({ ...prev, [current.id]: value }));
  }

  function handleNext() {
    if (step < total - 1) {
      setStep(s => s + 1);
    } else {
      handleSave();
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  function handleSave() {
    const today = new Date().toISOString().split('T')[0];
    const completion = (answers['completion'] as Completion) || 'skipped';
    const energy = (answers['energy'] as EnergyLevel) || 'low';
    const effectiveness = answers['effectiveness'] || 'neutral';
    const msg = getRandomFeedback(state.currentStage);

    const record: DailyRecord = {
      date: today,
      stageId: state.currentStage,
      nudge,
      lowEnergyMode: state.lowEnergyMode,
      completion,
      energy,
      effectiveness,
      actionScore: calcActionScore(completion),
      effectivenessScore: calcEffectivenessScore(effectiveness),
      reflections: answers,
      feedback: msg,
    };

    const next = addDailyRecord(state, record);
    saveState(next);
    onStateChange(next);
    setFeedback(msg);
    setDone(true);
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{ background: 'rgba(61,53,48,0.5)', backdropFilter: 'blur(8px)' }}>
        <div className="bg-cream rounded-t-4xl px-6 pt-6 pb-10 animate-slide-up">
          <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-6" />
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full ${colors.active} mx-auto mb-4 flex items-center justify-center`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-serif text-xl text-warm-900 mb-3">Saved</p>
            <p className="text-warm-500 text-sm leading-7 italic max-w-xs mx-auto">"{feedback}"</p>
            <button
              onClick={onClose}
              className="mt-8 w-full py-3 rounded-2xl bg-white border border-warm-100 text-sm text-warm-700 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(61,53,48,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-t-4xl flex flex-col animate-slide-up"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-4 pb-2 px-6">
          <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-warm-400 uppercase tracking-wide">
              {stage.name} · Day reflection
            </p>
            <button onClick={onClose} className="text-warm-300 p-1 -mr-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className={`h-1 ${colors.bar} rounded-full mb-6`}>
            <div
              className={`h-1 ${colors.active} rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Today's nudge reminder */}
          <div className="bg-white rounded-2xl px-4 py-3 mb-6 border border-warm-100">
            <p className="text-xs text-warm-400 mb-1">Today's nudge</p>
            <p className="text-warm-700 text-sm leading-snug">{nudge}</p>
          </div>

          {/* Question */}
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">
            Question {step + 1} of {total}
          </p>
          <p className="font-serif text-xl text-warm-900 leading-snug mb-6">{current?.text}</p>

          {/* Options */}
          {current?.type === 'options' && (
            <div className="space-y-2.5">
              {current.options?.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOption(opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all ${
                    answer === opt.value
                      ? `bg-white border-warm-400 text-warm-900 shadow-sm`
                      : 'bg-white border-warm-100 text-warm-600'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full border mr-3 transition-all ${
                    answer === opt.value ? `${colors.active} border-transparent` : 'border-warm-300'
                  }`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Free text */}
          {current?.type === 'text' && (
            <textarea
              value={answer}
              onChange={e => handleText(e.target.value)}
              placeholder={current.id === 'thoughts'
                ? "No filter needed — whatever is floating around..."
                : "Write anything — even a few words is enough."}
              rows={current.id === 'thoughts' ? 5 : 4}
              className="w-full bg-white border border-warm-100 rounded-2xl px-4 py-3 text-sm text-warm-800 placeholder-warm-300 resize-none focus:outline-none focus:border-warm-300"
            />
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-2xl bg-white border border-warm-100 text-sm text-warm-500"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance && current?.type === 'options'}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
                canAdvance || current?.type === 'text'
                  ? `${colors.active} text-white`
                  : 'bg-warm-100 text-warm-300 cursor-not-allowed'
              }`}
            >
              {step === total - 1 ? 'Save reflection' : 'Next →'}
            </button>
          </div>

          {/* Skip option */}
          {current?.type === 'text' && (
            <button
              onClick={handleNext}
              className="w-full mt-3 text-xs text-warm-300 text-center py-2"
            >
              Skip this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
