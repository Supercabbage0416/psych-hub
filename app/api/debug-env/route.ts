import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  const result: Record<string, unknown> = {
    deepseek_key: apiKey ? `set (${apiKey.slice(0, 10)}...)` : 'MISSING',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
  };

  // Live test — send a minimal request to DeepSeek
  if (apiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Reply with exactly: {"ok": true}' }],
          max_tokens: 20,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content ?? '';
        const reasoning = choice?.message?.reasoning_content ?? '';
        result.deepseek_test = 'PASS';
        result.deepseek_response = content;
        result.deepseek_reasoning = reasoning ? reasoning.slice(0, 100) : '(none)';
        result.deepseek_raw_message = choice?.message ?? '(no choice)';
      } else {
        const err = await res.text();
        result.deepseek_test = `FAIL (${res.status})`;
        result.deepseek_error = err.slice(0, 300);
      }
    } catch (e) {
      result.deepseek_test = 'FAIL (exception)';
      result.deepseek_error = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.deepseek_test = 'SKIPPED (no key)';
  }

  // Live test — reflect-insight analyze path
  if (apiKey) {
    try {
      const insightPrompt = `You are a warm personal coach. Based on: mood="okay", journal="Had a tough week but managed to exercise twice", reflect on what's going well. Respond ONLY in valid JSON: {"mood": "...", "motivation": "...", "status": "...", "recommendation": "...", "reasoning": "..."}`;
      const res2 = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: insightPrompt }],
          max_tokens: 300,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const content2 = data2.choices?.[0]?.message?.content ?? '';
        result.reflect_insight_test = content2.includes('"mood"') ? 'PASS' : `UNEXPECTED: ${content2.slice(0, 100)}`;
        result.reflect_insight_response = content2.slice(0, 200);
      } else {
        result.reflect_insight_test = `FAIL (${res2.status})`;
      }
    } catch (e) {
      result.reflect_insight_test = 'FAIL (exception)';
      result.reflect_insight_error = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.reflect_insight_test = 'SKIPPED (no key)';
  }

  return NextResponse.json(result);
}
