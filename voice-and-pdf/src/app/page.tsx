import Link from "next/link";
import { Mic, FileText, ArrowRight, Sparkles } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>
              AI Portal<span className="text-indigo-400">.</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium sm:gap-4">
            <div className="hidden rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-neutral-300 shadow-sm backdrop-blur-md sm:block">
              Ver 2.0
            </div>
            <AuthStatus />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24">
        <div className="mb-12 max-w-2xl px-2 sm:mb-16">
          <h1 className="mb-4 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:mb-6 sm:text-6xl">
            AIで作業をもっと軽く
          </h1>
          <p className="text-base font-medium leading-relaxed text-neutral-400 sm:text-lg">
            PDF 翻訳と音声文字起こしを、ひとつのポータルでまとめて使えるツールです。
            日々の調査、海外資料の読解、会話音声の文字起こしまで、実務に寄り添う AI
            機能をすぐに使い始められます。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          <Link
            href="/pdf-translator"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 transition-all hover:border-white/20 hover:bg-white/10 sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-4 inline-flex w-fit rounded-2xl bg-indigo-500/20 p-3 text-indigo-400 ring-1 ring-indigo-500/30 sm:mb-6 sm:p-4">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold sm:text-2xl">PDF 翻訳ツール</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-neutral-400 sm:text-base">
                PDF ファイルをアップロードするだけで、読みやすい日本語に翻訳できます。
                翻訳後は音声読み上げ機能も使えます。
              </p>
              <div className="flex w-full items-center justify-center rounded-xl bg-indigo-500/20 px-4 py-3 font-bold text-indigo-300 transition-all group-hover:text-indigo-300 sm:justify-start sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-indigo-400">
                ツールを開く
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </div>
            </div>
          </Link>

          <Link
            href="/transcription"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 transition-all hover:border-white/20 hover:bg-white/10 sm:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-4 inline-flex w-fit rounded-2xl bg-emerald-500/20 p-3 text-emerald-400 ring-1 ring-emerald-500/30 sm:mb-6 sm:p-4">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold sm:text-2xl">音声文字起こし</h3>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-neutral-400 sm:text-base">
                音声や動画ファイルをアップロードすると、すばやくテキスト化できます。
                議事録、インタビュー、講義内容の整理にも向いています。
              </p>
              <div className="flex w-full items-center justify-center rounded-xl bg-emerald-500/20 px-4 py-3 font-bold text-emerald-300 transition-all group-hover:text-emerald-300 sm:justify-start sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-emerald-400">
                ツールを開く
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
