'use client';

import { useState } from 'react';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import ReflectionInsight from '@/components/ReflectionInsight';
import LessonsSection from '@/components/LessonsSection';
import CozyRoom from '@/components/CozyRoom';
import { listLessons } from '@/lib/supabase';

export default function ReflectPage() {
  const [activeTab, setActiveTab] = useState<'insight' | 'lessons' | 'monthly'>('insight');

  return (
    <div style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden' }}>
      <CozyRoom hideFireplace hideLamp />

      <div className="relative z-10 px-5 pt-8 pb-8 animate-fade-in">
        <div className="mb-5">
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">The shape of your weeks</p>
          <h1 className="font-serif text-3xl text-warm-900">Reflect</h1>
        </div>

        {/* 3-tab segmented control */}
        <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl mb-6">
          {([
            { id: 'insight', label: '✨ Weekly read' },
            { id: 'lessons', label: '🔥 Lessons' },
            { id: 'monthly', label: '📅 Calendar' },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                activeTab === id ? 'bg-white text-warm-800 shadow-card' : 'text-warm-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'insight' && <ReflectionInsight />}
        {activeTab === 'lessons' && <LessonsSection listLessons={listLessons} />}
        {activeTab === 'monthly' && <MonthlyCalendar />}
      </div>
    </div>
  );
}
