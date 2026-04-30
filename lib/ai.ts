// DeepSeek API for article summarization (free tier)
// Journal data never sent here — only user-submitted articles

export async function summarizeWithAI(title: string, text: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You summarize psychology articles in 2 sentences. Be clear, human, and practical. No jargon.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${text.slice(0, 1500)}`,
          },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// Build a pre-formatted prompt for ChatGPT handoff
export function buildChatGPTPrompt(type: 'article' | 'journal' | 'weekly', context: string): string {
  const prefixes: Record<string, string> = {
    article: `I just read this psychology article and want to reflect on it:\n\n${context}\n\nHelp me connect this to my daily life. What patterns might it point to?`,
    journal: `I wrote this in my journal today:\n\n${context}\n\nHelp me think deeper — what am I processing? What questions would help me explore this?`,
    weekly: `Here's my week in reflection:\n\n${context}\n\nWhat themes or patterns do you notice? What one gentle insight might I carry forward?`,
  };
  return prefixes[type] ?? context;
}

export function openChatGPT(prompt: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(prompt).catch(() => {});
  }
  const encoded = encodeURIComponent(prompt);
  const appUrl = `chatgpt://chat?text=${encoded}`;
  const webUrl = `https://chat.openai.com/`;
  window.location.href = appUrl;
  setTimeout(() => window.open(webUrl, '_blank'), 1500);
}
