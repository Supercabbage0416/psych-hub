import type { DailyRecord, RecoveryState, StageReadiness, WeeklySummary, EnergyLevel } from './types';
import { SCORING, getStage } from './config';

export function calcActionScore(completion: string): number {
  return SCORING.action[completion] ?? 0;
}

export function calcEffectivenessScore(effectiveness: string): number {
  return SCORING.effectiveness[effectiveness] ?? 0;
}

export function checkStageReadiness(state: RecoveryState): StageReadiness {
  const { currentStage, stageStartDate, records } = state;
  const stage = getStage(currentStage);
  const today = new Date().toISOString().split('T')[0];
  const stageRecords = records.filter(r => r.stageId === currentStage);

  const stageStart = new Date(stageStartDate);
  const now = new Date(today);
  const daysInStage = Math.floor((now.getTime() - stageStart.getTime()) / 86400000) + 1;

  const { lookbackDays, minEngagementRate, minAvgActionScore, minAvgEffectivenessScore, minPossibleDays } = SCORING.readiness;
  const cutoff = new Date(now.getTime() - lookbackDays * 86400000).toISOString().split('T')[0];
  const recent = stageRecords.filter(r => r.date >= cutoff);

  const engagementRate = lookbackDays > 0 ? Math.min(recent.length, lookbackDays) / lookbackDays : 0;
  const avgActionScore = recent.length > 0
    ? recent.reduce((s, r) => s + r.actionScore, 0) / recent.length : 0;
  const avgEffectivenessScore = recent.length > 0
    ? recent.reduce((s, r) => s + r.effectivenessScore, 0) / recent.length : 0;
  const possibleDays = recent.filter(r =>
    ['easy', 'slightly_easy', 'neutral'].includes(r.effectiveness)
  ).length;

  // Check if skips are increasing (compare last 7 vs prior 7)
  const last7 = recent.filter(r => {
    const d = new Date(r.date);
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff < 7;
  });
  const prior7 = recent.filter(r => {
    const d = new Date(r.date);
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff >= 7 && diff < 14;
  });
  const last7Skips = last7.filter(r => r.completion === 'skipped').length;
  const prior7Skips = prior7.filter(r => r.completion === 'skipped').length;
  const increasingSkips = last7Skips > prior7Skips + 1;

  const metMinDays = daysInStage >= stage.minDays;
  const metEngagement = engagementRate >= minEngagementRate;
  const metAction = avgActionScore >= minAvgActionScore;
  const metEffectiveness = avgEffectivenessScore >= minAvgEffectivenessScore;
  const metPossible = possibleDays >= minPossibleDays;
  const notIncreasingSkips = !increasingSkips;

  const ready = metMinDays && metEngagement && metAction && metEffectiveness && metPossible && notIncreasingSkips;

  let recommendation: StageReadiness['recommendation'] = 'advance';
  if (!ready) {
    if (increasingSkips || avgActionScore < 0.5) recommendation = 'easier';
    else if (!metMinDays || !metEngagement) recommendation = 'extend';
    else recommendation = 'extend';
  }

  return {
    ready,
    daysInStage,
    engagementRate,
    avgActionScore,
    avgEffectivenessScore,
    possibleDays,
    increasingSkips,
    recommendation,
  };
}

export function shouldActivateLowEnergy(state: RecoveryState): boolean {
  const today = new Date().toISOString().split('T')[0];
  const recent = state.records
    .filter(r => r.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  return recent.length >= 3 && recent.every(r => r.completion === 'skipped');
}

export function shouldOfferChallenge(state: RecoveryState): boolean {
  const today = new Date().toISOString().split('T')[0];
  const recent = state.records
    .filter(r => r.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return recent.length >= 5 && recent.every(r => r.completion !== 'skipped');
}

export function getTodayNudge(state: RecoveryState): string {
  const stage = getStage(state.currentStage);
  const nudges = state.lowEnergyMode ? stage.lowEnergyNudges : stage.nudges;
  const stageRecords = state.records.filter(r => r.stageId === state.currentStage);
  return nudges[stageRecords.length % nudges.length];
}

export function getRandomFeedback(stageId: string): string {
  const stage = getStage(stageId as never);
  const msgs = stage.feedbackMessages;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  very_low: 'Very low',
  low: 'Low',
  medium: 'Medium',
  okay: 'Okay',
};

export function buildWeeklySummary(state: RecoveryState): WeeklySummary {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const week = state.records.filter(r => r.date >= weekAgo && r.date <= today);

  const daysEngaged = week.filter(r => r.completion !== 'skipped').length;

  // Most common energy
  const energyCounts: Record<string, number> = {};
  week.forEach(r => { energyCounts[r.energy] = (energyCounts[r.energy] ?? 0) + 1; });
  const mostCommonEnergy = Object.entries(energyCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as EnergyLevel ?? 'low';

  const wins: string[] = [];
  if (daysEngaged >= 5) wins.push(`You showed up ${daysEngaged} out of 7 days.`);
  if (week.some(r => r.completion === 'completed')) wins.push('You completed at least one full action this week.');
  if (week.filter(r => r.completion === 'skipped').length < 3) wins.push('You kept most days going, even partially.');

  const patterns: string[] = [];
  const skips = week.filter(r => r.completion === 'skipped').length;
  if (skips >= 4) patterns.push('Several days this week felt too heavy to continue.');
  if (week.filter(r => r.effectiveness === 'too_hard').length >= 3) patterns.push('The current nudges may be slightly too demanding.');
  if (state.lowEnergyMode) patterns.push('Low-energy mode has been active this week.');

  let adjustment = 'Keep going at your current pace.';
  if (skips >= 4) adjustment = 'Next week, the app will keep nudges very gentle.';
  else if (daysEngaged >= 6) adjustment = 'You are building real consistency. The next stage may be close.';

  return {
    weekStart: weekAgo,
    daysEngaged,
    totalDays: 7,
    mostCommonEnergy: ENERGY_LABELS[mostCommonEnergy as EnergyLevel] ?? mostCommonEnergy,
    patterns,
    wins,
    adjustment,
  };
}
