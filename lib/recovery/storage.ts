import type { RecoveryState, DailyRecord } from './types';
import { STAGE_ORDER } from './config';
import { shouldActivateLowEnergy } from './scoring';
import { supabase, getDeviceId } from '@/lib/supabase';

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
  syncStateToSupabase(state).catch(() => {});
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

  updated.lowEnergyMode = shouldActivateLowEnergy(updated);

  // Persist to Supabase in background
  syncRecordToSupabase(record).catch(() => {});

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

export function activateLowEnergyMode(state: RecoveryState): RecoveryState {
  return { ...state, lowEnergyMode: true };
}

export function deactivateLowEnergyMode(state: RecoveryState): RecoveryState {
  return { ...state, lowEnergyMode: false };
}

// --- Supabase sync (fire-and-forget) ---

async function syncRecordToSupabase(record: DailyRecord): Promise<void> {
  const deviceId = getDeviceId();
  if (!deviceId) return;
  await supabase.from('recovery_records').upsert({
    device_id: deviceId,
    date: record.date,
    stage_id: record.stageId,
    nudge: record.nudge,
    low_energy_mode: record.lowEnergyMode,
    completion: record.completion,
    energy: record.energy,
    effectiveness: record.effectiveness,
    action_score: record.actionScore,
    effectiveness_score: record.effectivenessScore,
    reflections: record.reflections,
    feedback: record.feedback,
  }, { onConflict: 'device_id,date' });
}

async function syncStateToSupabase(state: RecoveryState): Promise<void> {
  const deviceId = getDeviceId();
  if (!deviceId) return;
  await supabase.from('recovery_state').upsert({
    device_id: deviceId,
    current_stage: state.currentStage,
    stage_start_date: state.stageStartDate,
    low_energy_mode: state.lowEnergyMode,
    low_energy_streak: state.lowEnergyStreak,
    success_streak: state.successStreak,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'device_id' });
}

// Load records from Supabase (for cross-device or backup restore)
export async function loadRecordsFromSupabase(): Promise<DailyRecord[]> {
  const deviceId = getDeviceId();
  if (!deviceId) return [];
  const { data } = await supabase
    .from('recovery_records')
    .select('*')
    .eq('device_id', deviceId)
    .order('date', { ascending: true });
  if (!data) return [];
  return data.map(r => ({
    date: r.date,
    stageId: r.stage_id,
    nudge: r.nudge ?? '',
    lowEnergyMode: r.low_energy_mode ?? false,
    completion: r.completion ?? 'skipped',
    energy: r.energy ?? 'low',
    effectiveness: r.effectiveness ?? 'neutral',
    actionScore: r.action_score ?? 0,
    effectivenessScore: r.effectiveness_score ?? 0,
    reflections: r.reflections ?? {},
    feedback: r.feedback ?? '',
  }));
}
