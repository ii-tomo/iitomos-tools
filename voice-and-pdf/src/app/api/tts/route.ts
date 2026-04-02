import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { consumeCredits } from "@/utils/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "音声化するテキストが必要です。" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "サーバー側で OpenAI API キーが設定されていません。" },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const creditResult = await consumeCredits(supabase, user.id, 1);

    if (!creditResult.success) {
      return NextResponse.json(
        {
          error: "クレジットが不足しています。",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      );
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Credits-Remaining": creditResult.remaining?.toString() || "",
      },
    });
  } catch (error: unknown) {
    console.error("TTS Generation Error:", error);
    return NextResponse.json(
      {
        error: "AI 音声の生成に失敗しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
