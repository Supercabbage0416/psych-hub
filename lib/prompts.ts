export const reflectivePrompts = [
  "What does this remind you of in your own life right now?",
  "If you applied just one idea from this today, what would quietly shift?",
  "What feels true about this — and what feels incomplete?",
  "Where have you seen this play out, in yourself or someone close to you?",
  "What would you tell a friend who needed to hear this?",
  "What part of this surprises you most?",
  "How does this connect to how you've been feeling lately?",
  "If this were a small message from the world to you, what would it say?",
  "What's one tiny thing this makes you want to try this week?",
  "Does this change how you see a recent moment in your life?",
  "What has your body been telling you that your mind has been ignoring?",
  "Is there a pattern here you've noticed before but never named?",
  "What would it feel like to let this idea actually land?",
  "Who in your life might already know this intuitively?",
];

export function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return reflectivePrompts[dayOfYear % reflectivePrompts.length];
}

export const weeklyObservationPrompts = [
  "This week, what moment — however small — felt most like you?",
  "What did you notice about how you respond when things feel uncertain?",
  "Where did you feel most at ease this week, and what made that possible?",
  "What drained you most, and is there a pattern behind it?",
  "What did you learn about yourself that you didn't expect?",
  "When did you feel most connected — to an idea, a person, or yourself?",
  "What would you do differently if you were just 10% more rested?",
  "What small thing this week deserved more attention than it got?",
];

export function getWeeklyObservationPrompt(): string {
  const week = Math.floor(Date.now() / (7 * 86400000));
  return weeklyObservationPrompts[week % weeklyObservationPrompts.length];
}
