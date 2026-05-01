'use client';

import { useEffect, useState } from 'react';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import ReflectionInsight from '@/components/ReflectionInsight';

export default function ReflectPage() {
  const [activeTab, setActiveTab] = useState<'insight' | 'monthly'>('insight');

  return (
    <div className="px-5 pt-8 animate-fade-in pb-8">
      <div className="mb-5">
        <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">The shape of your weeks</p>
        <h1 className="font-serif text-3xl text-warm-900">Patterns</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl mb-6">
        {([
          { id: 'insight', label: '✨ Weekly read' },
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
      {activeTab === 'monthly' && <MonthlyCalendar />}
    </div>
  );
}
