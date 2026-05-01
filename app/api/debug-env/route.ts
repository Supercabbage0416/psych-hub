import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    deepseek: process.env.DEEPSEEK_API_KEY ? 'set (' + process.env.DEEPSEEK_API_KEY.slice(0, 8) + '...)' : 'MISSING',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
  });
}
