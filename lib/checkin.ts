// Daily check-in types and article recommendation logic.
// All 5 dimensions are optional after mood so the user can stop early.

export type MoodValue =
  | 'calm' | 'okay' | 'alive' | 'heavy' | 'scattered' | 'numb'
  | 'anxious' | 'tender'                                    // night orbs v7
  | 'steady' | 'restless' | 'energized' | 'soft'           // day orbs v7 (old)
  | 'locked_in' | 'wired' | 'sharp' | 'foggy';             // day orbs v7.2
export type ScaleValue = 1 | 2 | 3 | 4 | 5;

export interface DailyCheckIn {
  mood: MoodValue;
  energy: ScaleValue;       // 1 = depleted, 5 = full
  stress: ScaleValue;       // 1 = calm, 5 = overwhelmed
  selfWorth: ScaleValue;    // 1 = very low, 5 = strong
  socialSafety: ScaleValue; // 1 = very unsafe, 5 = very safe
  date: string;             // YYYY-MM-DD
}

// Partial version used while stepping through the modal
export type PartialCheckIn = Partial<DailyCheckIn> & { mood: MoodValue };

export type ArticleField = 'behavioral' | 'stress' | 'group_social' | 'io_work';

export interface FieldRecommendation {
  field: ArticleField;
  label: string;
  reason: string;
  priority: number;
}

// Human-readable labels for each RSS field
export const FIELD_LABELS: Record<ArticleField, string> = {
  behavioral: 'Behavioral Activation',
  stress: 'Stress & Recovery',
  group_social: 'Social & Shame',
  io_work: 'Meaning & Autonomy',
};

// Scale labels for each dimension
export const ENERGY_LABELS: Record<ScaleValue, string> = {
  1: 'Depleted',
  2: 'Very low',
  3: 'Some energy',
  4: 'Pretty good',
  5: 'Full energy',
};

export const STRESS_LABELS: Record<ScaleValue, string> = {
  1: 'Calm',
  2: 'Mild tension',
  3: 'Noticeably stressed',
  4: 'High stress',
  5: 'Overwhelmed',
};

export const SELF_WORTH_LABELS: Record<ScaleValue, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Uncertain',
  4: 'Okay',
  5: 'Strong',
};

export const SOCIAL_SAFETY_LABELS: Record<ScaleValue, string> = {
  1: 'Very unsafe',
  2: 'Guarded',
  3: 'Neutral',
  4: 'Mostly safe',
  5: 'Very safe',
};

// Recommend which article fields are most relevant given today's check-in.
// Returns ordered list with the highest-priority fields first.
export function getFieldRecommendations(checkIn: PartialCheckIn): FieldRecommendation[] {
  const needs: FieldRecommendation[] = [];
  const energy = checkIn.energy ?? 3;
  const stress = checkIn.stress ?? 3;
  const selfWorth = checkIn.selfWorth ?? 3;
  const socialSafety = checkIn.socialSafety ?? 3;

  if (stress >= 4) {
    needs.push({
      field: 'stress',
      label: FIELD_LABELS.stress,
      reason: 'Your stress is high — these may help regulate',
      priority: 10,
    });
  }
  if (socialSafety <= 2) {
    needs.push({
      field: 'group_social',
      label: FIELD_LABELS.group_social,
      reason: 'Social safety feels low — understanding shame and connection may help',
      priority: 9,
    });
  }
  if (selfWorth <= 2) {
    needs.push({
      field: 'group_social',
      label: FIELD_LABELS.group_social,
      reason: 'When self-worth is low, shame research is often most useful',
      priority: 8,
    });
    needs.push({
      field: 'behavioral',
      label: FIELD_LABELS.behavioral,
      reason: 'Small actions quietly rebuild self-trust',
      priority: 7,
    });
  }
  if (energy <= 2) {
    needs.push({
      field: 'behavioral',
      label: FIELD_LABELS.behavioral,
      reason: 'Low energy — gentle behavioral activation can help',
      priority: 6,
    });
  }
  if (stress >= 3 && needs.findIndex(n => n.field === 'stress') === -1) {
    needs.push({
      field: 'stress',
      label: FIELD_LABELS.stress,
      reason: 'Some tension today — nervous system science',
      priority: 5,
    });
  }
  // Meaning is always valuable for identity-connected users
  needs.push({
    field: 'io_work',
    label: FIELD_LABELS.io_work,
    reason: 'Staying connected to meaning and autonomy',
    priority: 2,
  });
  needs.push({
    field: 'behavioral',
    label: FIELD_LABELS.behavioral,
    reason: 'How behavior shapes mood and recovery',
    priority: 1,
  });

  // Deduplicate by field (keep highest priority)
  const seen = new Set<string>();
  return needs
    .sort((a, b) => b.priority - a.priority)
    .filter(n => {
      if (seen.has(n.field)) return false;
      seen.add(n.field);
      return true;
    });
}

// Short summary phrase for a check-in (used in Today header)
export function checkInSummaryLine(checkIn: PartialCheckIn): string {
  const mood = checkIn.mood;
  const energy = checkIn.energy ?? 3;
  const stress = checkIn.stress ?? 3;

  if (stress >= 4 && energy <= 2) return 'High stress, low energy today.';
  if (stress >= 4) return 'Running hot today. That is worth noticing.';
  if (energy <= 2) return 'Low energy today. Small still counts.';
  if (mood === 'heavy' || mood === 'numb') return 'A heavy day. You still showed up.';
  if (mood === 'alive' || mood === 'calm' || mood === 'energized') return 'Feeling relatively steady today.';
  if (mood === 'anxious' || mood === 'restless') return 'Some tension today. Worth noticing.';
  if (mood === 'tender' || mood === 'soft') return 'Something tender today. That is okay.';
  if (mood === 'steady') return 'Grounded and present.';
  return 'Checking in. That matters.';
}
