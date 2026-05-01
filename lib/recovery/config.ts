import type { Stage, StageId } from './types';

export const STAGES: Stage[] = [
  {
    id: 'stabilization',
    name: 'Stabilization',
    tagline: 'Energy & Stability',
    minDays: 21,
    nudges: [
      'Drink water and sit quietly for 2 minutes.',
      'Open the window or step outside for 3 minutes.',
      'Take a 5–10 minute walk, any pace.',
      'Eat something simple and sit with it — no screen.',
      'Clear one tiny surface.',
      'Write one word about how today feels.',
      'Put one thing back in its place.',
      'Feel your feet on the floor for 30 seconds.',
    ],
    lowEnergyNudges: [
      'Drink a glass of water.',
      'Open the window.',
      'Sit outside for 3 minutes.',
      'Write one word.',
      'Put your phone down for 2 minutes.',
      'Breathe slowly for 30 seconds.',
      'Do nothing, but mark that you are still here.',
    ],
    reflectionQuestions: [
      {
        id: 'completion',
        text: 'Did you do today\'s small action?',
        type: 'options',
        options: [
          { value: 'completed', label: 'Yes' },
          { value: 'partial', label: 'Partially' },
          { value: 'tried', label: 'Not today, but I tried' },
          { value: 'skipped', label: 'I could not continue today' },
        ],
      },
      {
        id: 'energy',
        text: 'What was your energy level today?',
        type: 'options',
        options: [
          { value: 'very_low', label: 'Very low' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'okay', label: 'Okay' },
        ],
      },
      {
        id: 'effectiveness',
        text: 'Did the action feel possible?',
        type: 'options',
        options: [
          { value: 'easy', label: 'Yes, felt possible' },
          { value: 'neutral', label: 'A little' },
          { value: 'difficult', label: 'Neutral' },
          { value: 'too_hard', label: 'Too hard today' },
        ],
      },
      {
        id: 'small_thing',
        text: 'What is one thing you did today, even if very small?',
        type: 'text',
      },
    ],
    feedbackMessages: [
      'Small still counts.',
      'You do not need to be productive today. You only need to stay connected to life in one small way.',
      'Not being able to continue is not failure. It means today\'s step was too heavy.',
      'Your body is doing its best. That is enough for now.',
      'One small thing is a real thing.',
    ],
  },

  {
    id: 'competence',
    name: 'Competence',
    tagline: 'Confidence Rebuilding',
    minDays: 30,
    nudges: [
      'Finish one tiny task with a clear end.',
      'Spend 5 minutes on something you have avoided.',
      'Reply to one simple message.',
      'Organize one small item.',
      'Write down one thing you handled today.',
      'Choose one "minimum version" of a task and do only that.',
      'Complete one small thing and notice that you did it.',
    ],
    lowEnergyNudges: [
      'Drink a glass of water.',
      'Open the window.',
      'Sit outside for 3 minutes.',
      'Write one word.',
      'Put your phone down for 2 minutes.',
      'Breathe slowly for 30 seconds.',
      'Do nothing, but mark that you are still here.',
    ],
    reflectionQuestions: [
      {
        id: 'completion',
        text: 'Did you complete or attempt the task?',
        type: 'options',
        options: [
          { value: 'completed', label: 'Completed' },
          { value: 'partial', label: 'Partially completed' },
          { value: 'tried', label: 'Tried but could not finish' },
          { value: 'skipped', label: 'Could not continue today' },
        ],
      },
      {
        id: 'energy',
        text: 'What was your energy level today?',
        type: 'options',
        options: [
          { value: 'very_low', label: 'Very low' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'okay', label: 'Okay' },
        ],
      },
      {
        id: 'effectiveness',
        text: 'Did this help your confidence, even slightly?',
        type: 'options',
        options: [
          { value: 'easy', label: 'Yes' },
          { value: 'neutral', label: 'A little' },
          { value: 'difficult', label: 'Not sure' },
          { value: 'too_hard', label: 'No' },
        ],
      },
      {
        id: 'proof',
        text: 'What did this action prove about you?',
        type: 'text',
      },
      {
        id: 'easier_harder',
        text: 'What made it easier or harder?',
        type: 'text',
      },
    ],
    feedbackMessages: [
      'Finishing something small is a real signal to your brain.',
      'You are rebuilding trust with yourself.',
      'Trying counts just as much when energy is low.',
      'One small completion today is a foundation for tomorrow.',
      'You do not need to prove yourself. You are already practicing.',
    ],
  },

  {
    id: 'autonomy',
    name: 'Autonomy',
    tagline: 'Life Control',
    minDays: 30,
    nudges: [
      'Choose one thing you want to do — not only something you have to do.',
      'Decide your first task before checking your phone.',
      'Say no to one unnecessary pressure today.',
      'Make one small plan for tomorrow.',
      'Choose one routine that genuinely supports you.',
      'Spend 10 minutes on something personally meaningful.',
      'Make one small decision without asking for reassurance.',
    ],
    lowEnergyNudges: [
      'Drink a glass of water.',
      'Open the window.',
      'Sit outside for 3 minutes.',
      'Write one word.',
      'Put your phone down for 2 minutes.',
      'Breathe slowly for 30 seconds.',
      'Do nothing, but mark that you are still here.',
    ],
    reflectionQuestions: [
      {
        id: 'completion',
        text: 'Did you make one intentional choice today?',
        type: 'options',
        options: [
          { value: 'completed', label: 'Yes' },
          { value: 'partial', label: 'Partially' },
          { value: 'tried', label: 'Not today, but I noticed what I wanted' },
          { value: 'skipped', label: 'I could not continue today' },
        ],
      },
      {
        id: 'energy',
        text: 'What was your energy level today?',
        type: 'options',
        options: [
          { value: 'very_low', label: 'Very low' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'okay', label: 'Okay' },
        ],
      },
      {
        id: 'effectiveness',
        text: 'Did this make you feel more in control?',
        type: 'options',
        options: [
          { value: 'easy', label: 'Yes' },
          { value: 'neutral', label: 'A little' },
          { value: 'difficult', label: 'Not sure' },
          { value: 'too_hard', label: 'No' },
        ],
      },
      {
        id: 'choice_made',
        text: 'What choice did you make?',
        type: 'text',
      },
      {
        id: 'learned',
        text: 'What did you learn about what you need?',
        type: 'text',
      },
    ],
    feedbackMessages: [
      'Every small choice is a vote for your own agency.',
      'You still have choices, even when everything feels uncertain.',
      'Saying no to one thing is saying yes to yourself.',
      'You can move gently and still move forward.',
      'Small decisions quietly rebuild a sense of control.',
    ],
  },

  {
    id: 'social',
    name: 'Social Safety',
    tagline: 'Shame Recovery',
    minDays: 30,
    nudges: [
      'Send one low-pressure message to someone you trust.',
      'Say hi to someone without trying to impress them.',
      'Notice one neutral or kind social signal today.',
      'Share one small honest thought with a safe person.',
      'Spend time near people without performing.',
      'Ask one simple question in a conversation.',
      'After a social interaction, write what actually happened — not what you fear it meant.',
    ],
    lowEnergyNudges: [
      'Drink a glass of water.',
      'Open the window.',
      'Sit near another person without pressure to talk.',
      'Write one word about how today felt socially.',
      'Put your phone down for 2 minutes.',
      'Breathe slowly for 30 seconds.',
      'Do nothing, but mark that you are still here.',
    ],
    reflectionQuestions: [
      {
        id: 'completion',
        text: 'Did you have a small social moment today?',
        type: 'options',
        options: [
          { value: 'completed', label: 'Yes' },
          { value: 'partial', label: 'Partially' },
          { value: 'tried', label: 'I noticed people but did not interact' },
          { value: 'skipped', label: 'I could not continue today' },
        ],
      },
      {
        id: 'energy',
        text: 'What was your energy level today?',
        type: 'options',
        options: [
          { value: 'very_low', label: 'Very low' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'okay', label: 'Okay' },
        ],
      },
      {
        id: 'effectiveness',
        text: 'How safe did it feel?',
        type: 'options',
        options: [
          { value: 'easy', label: 'Safe' },
          { value: 'slightly_easy', label: 'Slightly safe' },
          { value: 'neutral', label: 'Neutral' },
          { value: 'difficult', label: 'Difficult' },
          { value: 'too_hard', label: 'Unsafe' },
        ],
      },
      {
        id: 'shame',
        text: 'Did you feel embarrassed or ashamed?',
        type: 'options',
        options: [
          { value: 'strong', label: 'Yes, strongly' },
          { value: 'little', label: 'A little' },
          { value: 'not_much', label: 'Not much' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'what_happened',
        text: 'What happened, factually?',
        type: 'text',
      },
      {
        id: 'mind_said',
        text: 'What did your mind say it meant?',
        type: 'text',
      },
      {
        id: 'alternative',
        text: 'Is there another possible interpretation?',
        type: 'text',
      },
      {
        id: 'pattern',
        text: 'In that moment, did you...',
        type: 'options',
        options: [
          { value: 'overperform', label: 'Try too hard to be seen' },
          { value: 'withdraw', label: 'Withdraw' },
          { value: 'balanced', label: 'Stay somewhat balanced' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
    feedbackMessages: [
      'A social moment does not need to be perfect to be safe.',
      'Embarrassment is a feeling, not proof that you failed.',
      'You do not need to perform to deserve connection.',
      'One small, real moment is more nourishing than a perfect performance.',
      'Connection does not require you to be impressive.',
    ],
  },

  {
    id: 'meaning',
    name: 'Meaning',
    tagline: 'Self-Worth Integration',
    minDays: 45,
    nudges: [
      'Do one thing connected to a personal value.',
      'Write one sentence about what still matters to you.',
      'Notice one way you contributed today, however small.',
      'Do something kind for yourself without justifying it.',
      'Do something kind for another person without overperforming.',
      'Write one identity statement not based on external approval.',
      'Spend 10 minutes on something that used to matter — without forcing yourself to enjoy it.',
    ],
    lowEnergyNudges: [
      'Drink a glass of water.',
      'Open the window.',
      'Sit outside for 3 minutes.',
      'Write one word about what still matters.',
      'Put your phone down for 2 minutes.',
      'Breathe slowly for 30 seconds.',
      'Do nothing, but mark that you are still here.',
    ],
    reflectionQuestions: [
      {
        id: 'completion',
        text: "Did today's action connect to something meaningful?",
        type: 'options',
        options: [
          { value: 'completed', label: 'Yes' },
          { value: 'partial', label: 'A little' },
          { value: 'tried', label: 'Not sure' },
          { value: 'skipped', label: 'Not today' },
        ],
      },
      {
        id: 'energy',
        text: 'What was your energy level today?',
        type: 'options',
        options: [
          { value: 'very_low', label: 'Very low' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'okay', label: 'Okay' },
        ],
      },
      {
        id: 'effectiveness',
        text: 'Did your sense of self-worth feel...',
        type: 'options',
        options: [
          { value: 'easy', label: 'More stable' },
          { value: 'neutral', label: 'Slightly better' },
          { value: 'difficult', label: 'Same' },
          { value: 'too_hard', label: 'Worse today' },
        ],
      },
      {
        id: 'value',
        text: 'What value did it connect to?',
        type: 'text',
      },
      {
        id: 'still_trying',
        text: 'What did you do today that shows you are still trying?',
        type: 'text',
      },
      {
        id: 'kind_words',
        text: 'What would you say to yourself, kindly?',
        type: 'text',
      },
    ],
    feedbackMessages: [
      'You are still here. That already means something.',
      'Your worth is not built from productivity or approval.',
      'Meaning does not need to be loud to be real.',
      'You are rebuilding something durable — not a performance, but a foundation.',
      'What still matters to you is worth protecting.',
    ],
  },
];

export const STAGE_ORDER: StageId[] = [
  'stabilization', 'competence', 'autonomy', 'social', 'meaning',
];

export const SCORING = {
  action: { completed: 2, partial: 1, tried: 0.5, skipped: 0 } as Record<string, number>,
  effectiveness: { easy: 2, slightly_easy: 1.5, neutral: 1, difficult: 0.5, too_hard: 0 } as Record<string, number>,
  readiness: {
    minEngagementRate: 0.6,
    minAvgActionScore: 1.2,
    minAvgEffectivenessScore: 1.0,
    minPossibleDays: 5,
    lookbackDays: 14,
  },
};

export const TONE = {
  low_energy_activated: "Today's pace is gentler. That is not a step back — it is what recovery sometimes needs.",
  streak_broken: "Missing a day is part of the process. You are not starting over.",
  stage_ready: "You have been practicing this consistently. The next chapter is available when you feel ready.",
  stage_not_ready: "You have already started building this capacity. It may help to stay with this stage a little longer.",
  low_energy_3days: "The last few days have been heavy. The app will shift to gentler nudges until things feel lighter.",
  success_streak_5: "Five days of showing up is a real signal. Your capacity is returning.",
  morning: "Today does not need to be impressive. It only needs to happen.",
  skipped_day: "Not continuing is not failure. It tells us today's step was too heavy.",
};

export function getStage(id: StageId): Stage {
  return STAGES.find(s => s.id === id)!;
}

export function getNextStage(id: StageId): StageId | null {
  const idx = STAGE_ORDER.indexOf(id);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}
