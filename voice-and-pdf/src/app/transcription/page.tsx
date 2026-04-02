"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileAudio,
  Loader2,
  PlayCircle,
  CheckCircle2,
  Mic,
  Square,
  Radio,
  RefreshCw,
} from "lucide-react";
import { AudioReader } from "@/components/AudioReader";

export default function Transcription() {
  const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const recordedFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFile(recordedFile);

        const audio = new Audio(URL.createObjectURL(blob));
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setFile(null);
      setTranscribedText("");
      setError(null);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("マイクへのアクセスが拒否されたか、利用できません。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setTranscribedText("");
    setError(null);

    const objectUrl = URL.createObjectURL(uploadedFile);
    const audio = new Audio(objectUrl);
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      URL.revokeObjectURL(objectUrl);
    };
    audio.onerror = () => {
      setError("ファイルの解析に失敗しました。正しい音声または動画ファイルか確認してください。");
    };

    if (uploadedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setError("ファイルサイズが処理上限（25MB）を超えています。小さなファイルをアップロードしてください。");
    }
  };

  const handleReset = () => {
    setFile(null);
    setDuration(0);
    setTranscribedText("");
    setError(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError("ファイルサイズが処理上限（25MB）を超えているため、文字起こしを開始できません。");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duration", duration.toString());

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
          window.dispatchEvent(new CustomEvent("show_insufficient_modal"));
          return;
        }
        throw new Error(data.error || "文字起こしに失敗しました。");
      }

      setTranscribedText(data.text);
      if (data.creditsRemaining !== undefined) {
        window.dispatchEvent(
          new CustomEvent("credits_updated", { detail: { credits: data.creditsRemaining } }),
        );
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました。");
    } finally {
      setIsTranscribing(false);
    }
  };

  const isFileTooLarge = !!file && file.size > MAX_UPLOAD_SIZE_BYTES;
  const estimatedCredits = duration > 0 ? Math.max(1, Math.ceil(duration / 900)) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-neutral-950 to-neutral-950" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">音声文字起こし機能</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
          注意: 作業中にブラウザの戻るボタンやリロードを行うと、読み込み済みのファイルや文字起こし途中の内容は消えます。必要な内容はコピーしてから移動してください。
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-400 shadow-sm">
            <span className="text-lg">!</span>
            {error}
          </div>
        )}

        {!file && !isRecording ? (
          <div className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-6 sm:mt-8">
            <div className="mx-auto flex w-full rounded-3xl border border-white/10 bg-white/5 p-1.5 shadow-lg shadow-black/20 sm:w-fit">
              <button
                onClick={() => setMode("upload")}
                className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition-all sm:w-48 ${
                  mode === "upload" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                }`}
              >
                ファイルをアップロード
              </button>
              <button
                onClick={() => setMode("record")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all sm:w-48 ${
                  mode === "record"
                    ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                マイクで録音する
              </button>
            </div>

            {mode === "upload" ? (
              <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 transition-all hover:bg-white/10 sm:p-16">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  onChange={handleFileUpload}
                />
                <div className="pointer-events-none flex flex-col items-center justify-center text-center">
                  <div className="mb-6 rounded-[32px] bg-emerald-500/20 p-6 text-emerald-400 ring-1 ring-emerald-500/30 transition-transform group-hover:scale-110 sm:p-8">
                    <UploadCloud className="h-12 w-12 sm:h-16 sm:w-16" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold sm:text-3xl">ファイルを選択</h3>
                  <p className="mb-6 max-w-sm text-sm text-neutral-400 sm:text-base">
                    音声や動画ファイルを選ぶと、文字起こしを実行できます。
                  </p>
                  <div className="rounded-full border border-white/5 bg-black/40 px-4 py-2 text-xs font-bold text-neutral-400 shadow-inner">
                    最大動画/音声サイズ: 25MB
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[350px] flex-col items-center justify-center rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 sm:p-16">
                <div className="flex flex-col items-center gap-8">
                  <button
                    onClick={startRecording}
                    className="flex h-28 w-28 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-xl shadow-emerald-500/10 transition-all hover:scale-105 hover:bg-emerald-500/20"
                  >
                    <Mic className="h-12 w-12" />
                  </button>
                  <div className="text-center">
                    <h3 className="mb-3 text-xl font-bold sm:text-2xl">録音を開始</h3>
                    <p className="text-sm text-neutral-400 sm:text-base">
                      ブラウザから直接、その場で音声を録音できます。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isRecording ? (
          <div className="mx-auto mt-4 w-full max-w-3xl sm:mt-12">
            <div className="flex flex-col items-center justify-center rounded-[40px] border border-red-500/20 bg-red-950/10 p-12 shadow-2xl shadow-red-500/10 sm:p-20">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/30 blur-2xl" />
                  <button
                    onClick={stopRecording}
                    className="relative flex h-32 w-32 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20 text-red-500 shadow-xl shadow-red-500/30 transition-all active:scale-95 hover:bg-red-500/30"
                  >
                    <Square className="h-12 w-12 fill-current" />
                  </button>
                </div>
                <div className="text-5xl font-bold tracking-widest text-red-400 drop-shadow-md sm:text-7xl">
                  {formatTime(recordingTime)}
                </div>
                <p className="flex items-center gap-2 text-center text-sm font-bold text-red-300 sm:text-lg">
                  <Radio className="h-5 w-5 animate-pulse" />
                  録音中です。停止して保存してください
                </p>
              </div>
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex w-full min-w-0 items-start gap-4">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 ring-1 ring-emerald-500/30">
                <FileAudio className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-all text-base font-bold leading-relaxed sm:text-lg lg:break-words">
                  {file.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-400 sm:text-sm">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {duration > 0 && <span>{formatTime(Math.round(duration))}</span>}
                  {duration > 0 && (
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        isFileTooLarge
                          ? "border-red-500/20 bg-red-500/10 text-red-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {isFileTooLarge ? "25MB超過のため処理不可" : `目安: ${estimatedCredits}クレジット`}
                    </span>
                  )}
                  {transcribedText && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      完了
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 border-t border-white/5 pt-4 lg:w-auto lg:border-t-0 lg:pt-0">
              <button
                onClick={handleReset}
                className="flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-neutral-300 transition-all hover:bg-white/10 active:scale-[0.98] sm:flex-none sm:py-2.5"
              >
                <RefreshCw className="h-4 w-4" />
                クリア
              </button>
              {!transcribedText && (
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || isFileTooLarge}
                  className="flex min-w-[180px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600 sm:flex-none sm:py-2.5"
                >
                  {isFileTooLarge ? (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      開始できません
                    </>
                  ) : isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      実行中...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      文字起こし開始
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {file && !isRecording && (
          <div className="relative flex h-full min-h-[500px] flex-1 flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-6">
            <h3 className="mb-4 flex items-center justify-between text-base font-bold sm:text-lg">
              <span>文字起こし結果</span>
              {transcribedText && (
                <button
                  title="テキストをコピー"
                  onClick={() => navigator.clipboard.writeText(transcribedText)}
                  className="rounded-lg border border-emerald-500/10 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 shadow-sm transition-colors hover:bg-emerald-500/30 active:scale-95"
                >
                  結果をコピー
                </button>
              )}
            </h3>

            <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-black/50 p-4 text-sm leading-relaxed text-neutral-200 shadow-inner sm:p-8 sm:text-base">
              {!transcribedText && !isTranscribing && !isFileTooLarge && duration > 0 && (
                <div className="mb-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-emerald-100/90">
                  このファイルは分割処理ではなく、1回の文字起こしとして送信されます。クレジットは再生時間をもとに
                  15分ごとに1クレジットの目安で計算しています。
                </div>
              )}

              {isTranscribing ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-5 text-neutral-500">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
                    <Loader2 className="relative z-10 h-12 w-12 animate-spin text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="mb-2 text-lg font-bold text-emerald-400">OpenAI で音声を解析中...</p>
                    <p className="text-sm font-medium text-neutral-500">
                      ファイルの長さに応じては数十秒から数分かかる場合があります。しばらくお待ちください。
                    </p>
                  </div>
                </div>
              ) : transcribedText ? (
                <div className="whitespace-pre-wrap font-sans text-lg">{transcribedText}</div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-sm font-medium text-neutral-500">
                  上部の「文字起こし開始」ボタンを押してください。
                </div>
              )}
            </div>

            {transcribedText && !isTranscribing && (
              <div className="mt-6 shrink-0 border-t border-white/5 pt-4 md:mt-4">
                <AudioReader text={transcribedText} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
