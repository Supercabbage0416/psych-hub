const tagKeywords: Record<string, string[]> = {
  energy: ['tired', 'drained', 'exhausted', 'energized', 'fatigue', 'rest', 'sleep', 'burnout', 'recharge'],
  work: ['work', 'job', 'colleague', 'meeting', 'team', 'boss', 'office', 'project', 'deadline', 'manager', 'workplace'],
  relationships: ['friend', 'family', 'partner', 'relationship', 'connection', 'trust', 'conflict', 'people', 'lonely', 'together'],
  emotion: ['feel', 'feeling', 'emotion', 'anxious', 'sad', 'happy', 'angry', 'fear', 'joy', 'grief', 'stress', 'calm', 'numb', 'heavy'],
  behavior: ['habit', 'pattern', 'trigger', 'response', 'reaction', 'routine', 'change', 'behavior', 'action', 'choice'],
  growth: ['learn', 'grow', 'improve', 'goal', 'progress', 'realize', 'understand', 'insight', 'discovery', 'clarity'],
  self: ['I ', 'myself', 'identity', 'who I am', 'my mind', 'my body', 'self', 'inner', 'introspect', 'reflect'],
  body: ['body', 'physical', 'breath', 'walk', 'move', 'tension', 'pain', 'ache', 'breathe', 'exercise'],
};

export function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(tag);
    }
  }
  return found.length > 0 ? found : ['reflection'];
}

export const tagColors: Record<string, string> = {
  energy: 'bg-amber-100 text-amber-800',
  work: 'bg-blue-100 text-blue-800',
  relationships: 'bg-rose-100 text-rose-800',
  emotion: 'bg-purple-100 text-purple-800',
  behavior: 'bg-sage-pale text-sage',
  growth: 'bg-green-100 text-green-800',
  self: 'bg-warm-100 text-warm-700',
  body: 'bg-teal-100 text-teal-800',
  reflection: 'bg-warm-100 text-warm-500',
};
