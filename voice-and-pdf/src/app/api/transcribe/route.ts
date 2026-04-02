import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { consumeCredits } from '@/utils/credits';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is missing. Please configure .env.local' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const durationStr = formData.get('duration') as string | null;
    const duration = durationStr ? parseFloat(durationStr) : 0;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    // 1. ユーザー認証
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    // 2. クレジット計算 (15分ごとに1クレジット)
    // 15分 = 900秒
    const creditsNeeded = Math.max(1, Math.ceil(duration / 900));

    // 2. クレジット消費
    const creditResult = await consumeCredits(supabase, user.id, creditsNeeded);

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: `クレジットが不足しています。この処理には ${creditsNeeded} クレジット必要です。`,
        code: 'INSUFFICIENT_CREDITS' 
      }, { status: 402 });
    }

    // 3. OpenAI による文字起こし実行 (Whisper)
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return NextResponse.json({ 
      text: transcription,
      creditsRemaining: creditResult.remaining
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
  }
}
