import Link from "next/link";
import { Mic, FileText, ArrowRight, Sparkles } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950"></div>
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>AI Portal<span className="text-indigo-400">.</span></span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
            <div className="hidden sm:block rounded-full bg-white/10 px-4 py-1.5 text-neutral-300 backdrop-blur-md border border-white/10 shadow-sm">
              Ver 2.0
            </div>
            <AuthStatus />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-24">
        <div className="mb-12 sm:mb-16 max-w-2xl px-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-6xl mb-4 sm:mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
            AIで作業を高速化
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed font-medium">
            超高精度なPDF翻訳ツールと、音声をそのままテキスト化する高度なAIツールを使って、日々のワークフローを加速させましょう。
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2">
          {/* Card 1: PDF Translator */}
          <Link href="/pdf-translator" className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 transition-all hover:bg-white/10 hover:border-white/20 shadow-xl shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-4 sm:mb-6 inline-flex rounded-2xl bg-indigo-500/20 p-3 sm:p-4 text-indigo-400 ring-1 ring-indigo-500/30 w-fit">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-xl sm:text-2xl font-bold">PDF翻訳ツール</h3>
              <p className="mb-8 text-sm sm:text-base text-neutral-400 leading-relaxed flex-1">
                英語のPDFファイルをアップロードするだけで、解析から日本語への翻訳までを全自動で行います。抽出結果の音声読み上げも可能です。
              </p>
              <div className="flex w-full items-center justify-center sm:justify-start font-bold text-indigo-300 sm:text-indigo-400 group-hover:text-indigo-300 bg-indigo-500/20 sm:bg-transparent px-4 py-3 sm:px-0 sm:py-0 rounded-xl sm:rounded-none transition-all">
                アプリを開く <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 2: Voice Transcription */}
          <Link href="/transcription" className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 transition-all hover:bg-white/10 hover:border-white/20 shadow-xl shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-4 sm:mb-6 inline-flex rounded-2xl bg-emerald-500/20 p-3 sm:p-4 text-emerald-400 ring-1 ring-emerald-500/30 w-fit">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-xl sm:text-2xl font-bold">音声文字起こし</h3>
              <p className="mb-8 text-sm sm:text-base text-neutral-400 leading-relaxed flex-1">
                音声や動画ファイルをアップロード、またはマイクで録音して、高精度なAI文字起こしを実行します。
              </p>
              <div className="flex w-full items-center justify-center sm:justify-start font-bold text-emerald-300 sm:text-emerald-400 group-hover:text-emerald-300 bg-emerald-500/20 sm:bg-transparent px-4 py-3 sm:px-0 sm:py-0 rounded-xl sm:rounded-none transition-all">
                アプリを開く <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
