import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { consumeCredits } from "@/utils/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { text, targetLanguage = "Japanese" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "翻訳するテキストが必要です。" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return await handleGoogleFallback(text, targetLanguage);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("User not logged in, falling back to Google Translate");
      return await handleGoogleFallback(text, targetLanguage);
    }

    const creditResult = await consumeCredits(supabase, user.id, 1);

    if (!creditResult.success) {
      console.log("Insufficient credits, falling back to Google Translate:", creditResult.error);
      return await handleGoogleFallback(text, targetLanguage);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text into ${targetLanguage}. Maintain the original formatting, tone, and context. Only return the translated text without any conversational filler.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      translatedText,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "翻訳に失敗しました。" }, { status: 500 });
  }
}

async function handleGoogleFallback(text: string, targetLanguage: string) {
  console.log("Using Free Google Translate API Fallback");
  const langCode = targetLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
  const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;

  const gRes = await fetch(gUrl);
  if (!gRes.ok) throw new Error("Free translation API failed");

  const gData = await gRes.json();
  let translated = "";
  if (gData && gData[0]) {
    gData[0].forEach((item: [string]) => {
      if (item[0]) translated += item[0];
    });
  }

  const translatedText = translated ? `${translated} (無料翻訳エンジン)` : "";
  return NextResponse.json({ translatedText, fallback: true });
}
