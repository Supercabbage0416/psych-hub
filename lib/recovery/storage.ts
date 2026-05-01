import type { RecoveryState, DailyRecord } from './types';
import { STAGE_ORDER } from './config';
import { shouldActivateLowEnergy } from './scoring';

const KEY = 'recovery_state_v1';

const DEFAULT_STATE: RecoveryState = {
  currentStage: 'stabilization',
  stageStartDate: new Date().toISOString().split('T')[0],
  lowEnergyMode: false,
  lowEnergyStreak: 0,
  successStreak: 0,
  records: [],
};

export function loadState(): RecoveryState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as RecoveryState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: RecoveryState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getTodayRecord(state: RecoveryState): DailyRecord | null {
  const today = new Date().toISOString().split('T')[0];
  return state.records.find(r => r.date === today) ?? null;
}

export function addDailyRecord(state: RecoveryState, record: DailyRecord): RecoveryState {
  const existing = state.records.findIndex(r => r.date === record.date);
  const records = existing >= 0
    ? state.records.map((r, i) => (i === existing ? record : r))
    : [...state.records, record];

  const updated: RecoveryState = { ...state, records };

  // Update streaks
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayRecord = records.find(r => r.date === yesterday);

  if (record.completion === 'skipped') {
    updated.successStreak = 0;
    updated.lowEnergyStreak = state.lowEnergyStreak + 1;
  } else {
    updated.lowEnergyStreak = 0;
    updated.successStreak = yesterdayRecord && yesterdayRecord.completion !== 'skipped'
      ? state.successStreak + 1 : 1;
  }

  // Auto-activate low energy mode after 3 consecutive skips
  updated.lowEnergyMode = shouldActivateLowEnergy(updated);

  return updated;
}

export function advanceStage(state: RecoveryState): RecoveryState {
  const currentIdx = STAGE_ORDER.indexOf(state.currentStage);
  if (currentIdx >= STAGE_ORDER.length - 1) return state;
  return {
    ...state,
    currentStage: STAGE_ORDER[currentIdx + 1],
    stageStartDate: new Date().toISOString().split('T')[0],
    lowEnergyMode: false,
    lowEnergyStreak: 0,
    successStreak: 0,
  };
}

export function extendStage(state: RecoveryState): RecoveryState {
  return { ...state };
}

export function activateLowEnergyMode(state: RecoveryState): RecoveryState {
  const updated = { ...state, lowEnergyMode: true };
  saveState(updated);
  return updated;
}

export function deactivateLowEnergyMode(state: RecoveryState): RecoveryState {
  const updated = { ...state, lowEnergyMode: false };
  saveState(updated);
  return updated;
}
