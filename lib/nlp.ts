// Lightweight client-side NLP — no external model needed

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can','how',
  'why','what','when','where','which','who','that','this','these','those','it',
  'its','my','your','our','their','i','you','he','she','we','they','me','him',
  'her','us','them','not','also','just','so','very','more','less','than','up',
  'out','if','about','into','through','during','before','after','above','below',
  'between','each','few','more','most','other','some','such','no','nor','only',
  'same','then','too','very','s','t','can','will','don','ll','re','ve','m',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

export function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  tokens.forEach((t) => { tf[t] = (tf[t] ?? 0) + 1; });
  const max = Math.max(...Object.values(tf), 1);
  Object.keys(tf).forEach((k) => { tf[k] = tf[k] / max; });
  return tf;
}

export function extractKeywords(text: string, topN = 8): string[] {
  const tokens = tokenize(text);
  const tf = termFrequency(tokens);
  return Object.entries(tf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

export function extractiveSummarize(text: string, sentences = 2): string {
  const sentList = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.split(' ').length > 5);

  if (sentList.length <= sentences) return text.slice(0, 300);

  const allTokens = tokenize(text);
  const tf = termFrequency(allTokens);

  const scored = sentList.map((sent) => {
    const tokens = tokenize(sent);
    const score = tokens.reduce((sum, t) => sum + (tf[t] ?? 0), 0) / (tokens.length || 1);
    return { sent, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentences)
    .sort((a, b) => sentList.indexOf(a.sent) - sentList.indexOf(b.sent))
    .map((s) => s.sent)
    .join(' ');
}

// Sentiment via lexicon (no model download)
const POSITIVE_WORDS = new Set([
  'good','great','happy','joy','calm','peace','love','hope','better','improve',
  'progress','success','energy','motivated','grateful','positive','clear','strong',
  'confident','relax','rest','recover','growth','focus','achieve','relief','safe',
  'connect','support','warm','bright','gentle','ease','flow','alive','engaged',
]);

const NEGATIVE_WORDS = new Set([
  'stress','anxious','anxiety','tired','drained','heavy','sad','fear','worry',
  'anger','frustrated','overwhelmed','exhausted','lonely','lost','stuck','numb',
  'pressure','burden','fail','difficult','struggle','conflict','pain','tense',
  'nervous','scattered','confused','hopeless','empty','disconnected','irritated',
]);

export type SentimentLabel = 'reflective' | 'anxious' | 'heavy' | 'calm' | 'mixed';

export function analyzeSentiment(text: string): { label: SentimentLabel; score: number } {
  const tokens = tokenize(text);
  let pos = 0;
  let neg = 0;
  tokens.forEach((t) => {
    if (POSITIVE_WORDS.has(t)) pos++;
    if (NEGATIVE_WORDS.has(t)) neg++;
  });

  const total = pos + neg || 1;
  const score = (pos - neg) / total;

  if (pos === 0 && neg === 0) return { label: 'reflective', score: 0 };
  if (score > 0.3) return { label: 'calm', score };
  if (score < -0.4) return { label: 'heavy', score };
  if (neg > pos && neg > 2) return { label: 'anxious', score };
  return { label: 'mixed', score };
}

export function getThemesFromEntries(entries: { content: string }[]): string[] {
  const allText = entries.map((e) => e.content).join(' ');
  return extractKeywords(allText, 6);
}

// Category matching for articles
export const ARTICLE_CATEGORIES = {
  behavioral: {
    name: 'Behavioral Psychology',
    keywords: ['behavior','habit','routine','pattern','trigger','response','coping',
      'stress','anxiety','fear','reward','motivation','learning','conditioning'],
    color: 'sage',
  },
  io_work: {
    name: 'I/O & Workplace',
    keywords: ['team','leadership','organizational','collaboration','group','dynamics',
      'performance','workplace','manager','employee','communication','culture','burnout'],
    color: 'rose',
  },
  wellbeing: {
    name: 'Recovery & Wellbeing',
    keywords: ['sleep','recovery','rest','meditation','mindfulness','breathing','health',
      'wellbeing','mental','exercise','nutrition','resilience','self-care','balance'],
    color: 'amber',
  },
};

export function categorizeArticle(title: string, text: string): {
  id: string; name: string; color: string; confidence: number;
} {
  const combined = tokenize(`${title} ${text}`);
  const scores: Record<string, number> = {};

  for (const [id, cat] of Object.entries(ARTICLE_CATEGORIES)) {
    scores[id] = combined.filter((w) => cat.keywords.includes(w)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(scores).reduce((s, v) => s + v, 0) || 1;
  const confidence = Math.round((best[1] / total) * 100);
  const cat = ARTICLE_CATEGORIES[best[0] as keyof typeof ARTICLE_CATEGORIES];

  return { id: best[0], name: cat.name, color: cat.color, confidence };
}
