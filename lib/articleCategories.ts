// Article category definitions and mood → category matching.
// Categories map directly to the 10 user-defined wellbeing topics.
// Each category has diverse, evidence-based RSS sources.

import type { PartialCheckIn } from './checkin';

export type CategoryId =
  | 'behavioral_activation'
  | 'stress_recovery'
  | 'social_anxiety'
  | 'shame_embarrassment'
  | 'self_worth'
  | 'meaning_identity'
  | 'autonomy_uncertainty'
  | 'relationship_belonging'
  | 'burnout_recovery'
  | 'emotional_regulation';

export interface ArticleCategory {
  id: CategoryId;
  label: string;
  description: string; // shown to user as recommendation reason
  sources: string[];
  mustContain: string[];
  mustNotContain: string[];
}

// Common blocklist shared across all categories
const GLOBAL_BLOCK = [
  'alzheimer', 'cancer', 'tumor', 'surgery', 'vaccine', 'hospital',
  'diabetes', 'medication', 'prescription', 'clinical trial', 'drug treatment',
  'artificial intelligence', ' ai model', 'chatgpt', 'llm', 'machine learning',
  'robot', 'algorithm', 'deep learning', 'neural network',
  'climate change', 'election', 'stock market', 'cryptocurrency',
  'nuclear', 'war crimes',
  'gut', 'digestive', 'gastrointestinal', 'intestinal', 'bowel', 'ibs',
  'microbiome', 'genome', 'genetic', 'gene expression', 'dna', 'epigenetic',
  'neurological disorder', 'dementia', 'parkinson', 'schizophrenia',
];

export const CATEGORIES: ArticleCategory[] = [
  {
    id: 'behavioral_activation',
    label: 'Behavioral Activation',
    description: 'Small actions that rebuild energy and mood',
    sources: [
      'https://behavioralscientist.org/feed/',
      'https://bpsresearchdigest.com/feed/',
      'https://positivepsychology.com/feed/',
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
    ],
    mustContain: [
      'habit', 'action', 'activat', 'behavior', 'motivat', 'engag',
      'small step', 'routine', 'dopamine', 'reward', 'complet', 'goal',
      'initiat', 'procrastinat', 'momentum', 'inertia',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'stress_recovery',
    label: 'Stress & Recovery',
    description: 'Research on calming your nervous system',
    sources: [
      'https://www.mindful.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/stress.xml',
      'https://www.apa.org/rss/news.xml',
      'https://www.neurosciencenews.com/feed/',
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
    ],
    mustContain: [
      'stress', 'cortisol', 'nervous system', 'overwhelm', 'calm', 'rest',
      'recover', 'regulate', 'breathe', 'tension', 'pressure', 'resilien',
      'exhaust', 'overload', 'allostasis', 'parasympathetic',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'social_anxiety',
    label: 'Social Anxiety',
    description: 'Understanding fear of judgment and social performance',
    sources: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://www.neurosciencenews.com/feed/',
      'https://www.psychologicalscience.org/news/feed',
    ],
    mustContain: [
      'social anxiety', 'fear of', 'judgment', 'embarrass', 'awkward',
      'perform', 'self-conscious', 'evaluate', 'rejection', 'scrutin',
      'phobia', 'avoidance', 'hypervig', 'threat apprais',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'shame_embarrassment',
    label: 'Shame & Embarrassment',
    description: 'The psychology of shame and how to move through it',
    sources: [
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/emotions.xml',
      'https://positivepsychology.com/feed/',
    ],
    mustContain: [
      'shame', 'embarrass', 'guilt', 'self-critic', 'self-blame',
      'humiliat', 'failure', 'flaw', 'inadequ', 'worthless', 'exposed',
      'self-consciou', 'moral emotion',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'self_worth',
    label: 'Self-Worth',
    description: 'Research on self-esteem, self-compassion, and confidence',
    sources: [
      'https://positivepsychology.com/feed/',
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://www.mindful.org/feed/',
      'https://www.psychologicalscience.org/news/feed',
    ],
    mustContain: [
      'self-esteem', 'self-worth', 'self-compassion', 'self-efficacy',
      'confidence', 'validation', 'self-accept', 'inner critic', 'self-image',
      'self-belief', 'self-respect', 'self-regard', 'self-concept',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'meaning_identity',
    label: 'Meaning & Identity',
    description: 'Purpose, values, and what still matters to you',
    sources: [
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
      'https://positivepsychology.com/feed/',
      'https://behavioralscientist.org/feed/',
      'https://www.mindful.org/feed/',
    ],
    mustContain: [
      'meaning', 'purpose', 'value', 'identity', 'authentic', 'narrative',
      'existential', 'fulfillment', 'signific', 'mattering', 'contribut',
      'legacy', 'ikigai', 'eudaemon', 'calling', 'flourish',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'autonomy_uncertainty',
    label: 'Autonomy & Uncertainty',
    description: 'Regaining a sense of control when life feels uncertain',
    sources: [
      'https://behavioralscientist.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://positivepsychology.com/feed/',
    ],
    mustContain: [
      'autonomy', 'agency', 'control', 'uncertainty', 'adapt', 'decision',
      'choice', 'locus of control', 'self-determin', 'independ', 'ambiguity',
      'tolerat', 'unpredictab', 'flexibility', 'cope with change',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'relationship_belonging',
    label: 'Belonging & Connection',
    description: 'Research on connection, loneliness, and trust',
    sources: [
      'https://www.sciencedaily.com/rss/mind_brain/relationships.xml',
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://positivepsychology.com/feed/',
    ],
    mustContain: [
      'belong', 'connect', 'loneli', 'relationship', 'trust', 'attachment',
      'intimacy', 'friend', 'social support', 'isolation', 'community',
      'bond', 'closeness', 'accept', 'inclusion',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'burnout_recovery',
    label: 'Burnout Recovery',
    description: 'Restoration when you are running on empty',
    sources: [
      'https://www.mindful.org/feed/',
      'https://www.apa.org/rss/news.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/stress.xml',
      'https://positivepsychology.com/feed/',
    ],
    mustContain: [
      'burnout', 'exhaust', 'deplet', 'recharg', 'restor', 'drain',
      'chronic stress', 'fatigue', 'overwork', 'recover', 'energy',
      'demorali', 'detach', 'cynicism', 'compassion fatigue',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
  {
    id: 'emotional_regulation',
    label: 'Emotional Regulation',
    description: 'Working with difficult emotions, not against them',
    sources: [
      'https://bpsresearchdigest.com/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/emotions.xml',
      'https://greatergood.berkeley.edu/feeds/gg_articles.xml',
      'https://www.mindful.org/feed/',
      'https://www.neurosciencenews.com/feed/',
    ],
    mustContain: [
      'emotion regulat', 'emotional', 'regulate', 'accept', 'aware',
      'reapprais', 'distress toleran', 'feel', 'cope', 'mood',
      'affect', 'suppression', 'difficulting feeling', 'amplif', 'modulate',
    ],
    mustNotContain: GLOBAL_BLOCK,
  },
];

export function getCategoryById(id: CategoryId): ArticleCategory {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
}

// Maps a check-in state to 2-3 most relevant category IDs.
// Rule-based — no AI needed. Priority descends.
export function getCategoriesForCheckIn(checkIn: PartialCheckIn): CategoryId[] {
  const mood = checkIn.mood;
  const energy = checkIn.energy ?? 3;
  const stress = checkIn.stress ?? 3;
  const selfWorth = checkIn.selfWorth ?? 3;
  const socialSafety = checkIn.socialSafety ?? 3;

  const weighted: { id: CategoryId; priority: number }[] = [];

  // Stress
  if (stress >= 4) {
    weighted.push({ id: 'stress_recovery', priority: 10 });
    weighted.push({ id: 'emotional_regulation', priority: 7 });
  } else if (stress === 3) {
    weighted.push({ id: 'stress_recovery', priority: 5 });
  }

  // Social safety
  if (socialSafety <= 2) {
    weighted.push({ id: 'social_anxiety', priority: 10 });
    weighted.push({ id: 'shame_embarrassment', priority: 8 });
    weighted.push({ id: 'relationship_belonging', priority: 5 });
  } else if (socialSafety === 3) {
    weighted.push({ id: 'relationship_belonging', priority: 4 });
  }

  // Self-worth
  if (selfWorth <= 2) {
    weighted.push({ id: 'self_worth', priority: 10 });
    weighted.push({ id: 'shame_embarrassment', priority: 7 });
  } else if (selfWorth === 3) {
    weighted.push({ id: 'self_worth', priority: 4 });
  }

  // Energy
  if (energy <= 2) {
    weighted.push({ id: 'behavioral_activation', priority: 9 });
    weighted.push({ id: 'burnout_recovery', priority: 8 });
  } else if (energy === 3) {
    weighted.push({ id: 'behavioral_activation', priority: 3 });
  }

  // Mood overrides
  if (mood === 'heavy' || mood === 'numb') {
    weighted.push({ id: 'behavioral_activation', priority: 8 });
    weighted.push({ id: 'meaning_identity', priority: 6 });
  }
  if (mood === 'scattered') {
    weighted.push({ id: 'emotional_regulation', priority: 9 });
    weighted.push({ id: 'autonomy_uncertainty', priority: 6 });
  }
  if (mood === 'calm' || mood === 'alive') {
    weighted.push({ id: 'meaning_identity', priority: 6 });
    weighted.push({ id: 'autonomy_uncertainty', priority: 5 });
  }
  if (mood === 'okay') {
    weighted.push({ id: 'behavioral_activation', priority: 4 });
    weighted.push({ id: 'meaning_identity', priority: 4 });
  }

  // Deduplicate by id, keep highest priority, sort, take top 3
  const best = new Map<CategoryId, number>();
  for (const w of weighted) {
    const existing = best.get(w.id) ?? 0;
    if (w.priority > existing) best.set(w.id, w.priority);
  }

  const sorted = Array.from(best.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 3);

  // Always have at least 2 categories
  if (sorted.length === 0) return ['behavioral_activation', 'meaning_identity'];
  if (sorted.length === 1) return [sorted[0], 'meaning_identity'];
  return sorted;
}

// Human-readable explanation of why this category was recommended
export function getCategoryReason(id: CategoryId, checkIn: PartialCheckIn): string {
  const energy = checkIn.energy ?? 3;
  const stress = checkIn.stress ?? 3;
  const selfWorth = checkIn.selfWorth ?? 3;
  const socialSafety = checkIn.socialSafety ?? 3;

  switch (id) {
    case 'behavioral_activation':
      return energy <= 2 ? 'Low energy — small actions can shift it' : 'Staying connected to momentum';
    case 'stress_recovery':
      return stress >= 4 ? 'High stress today — research on regulation' : 'Managing tension';
    case 'social_anxiety':
      return socialSafety <= 2 ? 'Social safety feels low — understanding fear of judgment' : 'Social patterns';
    case 'shame_embarrassment':
      return selfWorth <= 2 || socialSafety <= 2 ? 'Self-criticism is high — shame research helps reframe it' : 'Processing shame';
    case 'self_worth':
      return selfWorth <= 2 ? 'Self-worth is low — evidence on building it back' : 'Strengthening self-regard';
    case 'meaning_identity':
      return 'What still matters — staying connected to purpose';
    case 'autonomy_uncertainty':
      return checkIn.mood === 'scattered' ? 'Feeling scattered — research on regaining control' : 'Agency and life decisions';
    case 'relationship_belonging':
      return socialSafety <= 3 ? 'Connection research when social safety feels low' : 'Building belonging';
    case 'burnout_recovery':
      return energy <= 2 ? 'Running low — recovery research' : 'Recharging effectively';
    case 'emotional_regulation':
      return stress >= 3 ? 'Working with difficult emotions, not against them' : 'Emotional awareness';
    default:
      return 'Based on how you are feeling today';
  }
}
