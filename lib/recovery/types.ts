export type StageId = 'stabilization' | 'competence' | 'autonomy' | 'social' | 'meaning';
export type Completion = 'completed' | 'partial' | 'tried' | 'skipped';
export type EnergyLevel = 'very_low' | 'low' | 'medium' | 'okay';

export interface OptionItem {
  value: string;
  label: string;
}

export interface RQuestion {
  id: string;
  text: string;
  type: 'options' | 'text';
  options?: OptionItem[];
}

export interface Stage {
  id: StageId;
  name: string;
  tagline: string;
  minDays: number;
  nudges: string[];
  lowEnergyNudges: string[];
  reflectionQuestions: RQuestion[];
  feedbackMessages: string[];
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  stageId: StageId;
  nudge: string;
  lowEnergyMode: boolean;
  completion: Completion;
  energy: EnergyLevel;
  effectiveness: string;
  actionScore: number;
  effectivenessScore: number;
  reflections: Record<string, string>;
  feedback: string;
}

export interface RecoveryState {
  currentStage: StageId;
  stageStartDate: string; // YYYY-MM-DD
  lowEnergyMode: boolean;
  lowEnergyStreak: number;
  successStreak: number;
  records: DailyRecord[];
}

export interface StageReadiness {
  ready: boolean;
  daysInStage: number;
  engagementRate: number;
  avgActionScore: number;
  avgEffectivenessScore: number;
  possibleDays: number;
  increasingSkips: boolean;
  recommendation: 'advance' | 'extend' | 'easier' | 'pause';
}

export interface WeeklySummary {
  weekStart: string;
  daysEngaged: number;
  totalDays: number;
  mostCommonEnergy: string;
  patterns: string[];
  wins: string[];
  adjustment: string;
}
