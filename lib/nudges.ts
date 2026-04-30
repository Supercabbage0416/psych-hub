export type EnergyLevel = 'low' | 'medium' | 'high';

export const moodEnergyMap: Record<string, EnergyLevel> = {
  calm: 'medium',
  heavy: 'low',
  scattered: 'low',
  okay: 'medium',
  alive: 'high',
  numb: 'low',
};

interface Nudge {
  text: string;
  duration: string;
  type: 'body' | 'mind' | 'social' | 'creative';
  energy: EnergyLevel[];
}

export const nudges: Nudge[] = [
  // Low energy
  { text: "Spend 10 minutes outside without your phone. Just notice what's around you — colors, sounds, air.", duration: "10 min", type: "body", energy: ["low"] },
  { text: "Draw anything on paper — a shape, a feeling, a place. No judgment, just lines.", duration: "15 min", type: "creative", energy: ["low"] },
  { text: "Put on one song you loved years ago and just listen. All the way through.", duration: "5 min", type: "mind", energy: ["low"] },
  { text: "Write down 3 things that existed today that made things slightly easier.", duration: "5 min", type: "mind", energy: ["low"] },
  { text: "Read 5 pages of any book. Any book. Just 5.", duration: "10 min", type: "mind", energy: ["low"] },
  { text: "Make something warm to drink and sit with it — no scrolling, just the warmth.", duration: "10 min", type: "body", energy: ["low"] },
  { text: "Lie down for 10 minutes. Not sleep — just rest. Eyes open or closed.", duration: "10 min", type: "body", energy: ["low"] },

  // Medium energy
  { text: "Take a different route somewhere today — even a small detour.", duration: "open", type: "body", energy: ["medium"] },
  { text: "Write a few lines to someone you're quietly grateful for. You don't have to send it.", duration: "10 min", type: "social", energy: ["medium"] },
  { text: "Spend 20 minutes doing something with your hands — cooking, drawing, folding, fixing.", duration: "20 min", type: "creative", energy: ["medium"] },
  { text: "Notice one moment today where you felt even slightly at ease. Write a single sentence about it.", duration: "5 min", type: "mind", energy: ["medium"] },
  { text: "Tidy one small space — a drawer, your desk corner, your phone screen.", duration: "15 min", type: "body", energy: ["medium"] },
  { text: "Call or message someone you haven't spoken to in a while. No agenda.", duration: "open", type: "social", energy: ["medium"] },

  // High energy
  { text: "Have a conversation today where you ask more questions than you answer.", duration: "open", type: "social", energy: ["high"] },
  { text: "Go somewhere you haven't been in a while — a street, a café, a park.", duration: "open", type: "body", energy: ["high"] },
  { text: "Try explaining something you learned this week to someone else.", duration: "open", type: "mind", energy: ["high"] },
  { text: "Write for 15 minutes without stopping — no editing, just letting thoughts move.", duration: "15 min", type: "creative", energy: ["high"] },

  // All energy levels
  { text: "Take 3 slow breaths before you check your phone in the morning. Just 3.", duration: "1 min", type: "body", energy: ["low", "medium", "high"] },
  { text: "Notice one thing today that you would normally walk past without seeing.", duration: "open", type: "mind", energy: ["low", "medium", "high"] },
];

export function getWeeklyNudge(mood: string | null): Nudge {
  const energy: EnergyLevel = mood ? (moodEnergyMap[mood] ?? 'medium') : 'medium';
  const week = Math.floor(Date.now() / (7 * 86400000));
  const matched = nudges.filter((n) => n.energy.includes(energy) || n.energy.includes('medium'));
  return matched[week % matched.length];
}
