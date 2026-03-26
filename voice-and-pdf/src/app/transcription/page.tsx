"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileAudio, Loader2, PlayCircle, CheckCircle2, Mic, Square, Radio, RefreshCw } from "lucide-react";
import { AudioReader } from "@/components/AudioReader";

export default function Transcription() {
  const [mode, setMode] = useState<'upload' | 'record'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recording states
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([blob], `recording-${new Date().getTime()}.webm`, { type: 'audio/webm' });
        setFile(recordedFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setFile(null);
      setTranscribedText("");
      setError(null);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setTranscribedText("");
    setError(null);
    if (uploadedFile.size > 25 * 1024 * 1024) {
      setError("ファイルサイズが処理上限（25MB）を超えています。小さなファイルをアップロードしてください。");
    }
  };

  const handleReset = () => {
    setFile(null);
    setTranscribedText("");
    setError(null);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "文字起こしに失敗しました。");
      }

      setTranscribedText(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-neutral-950 to-neutral-950"></div>
      
      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <Link href="/" className="rounded-full bg-white/5 border border-white/10 p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">音声文字起こし機能</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8">

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold shadow-sm flex items-center gap-2">
            <span className="text-lg">⚠</span> {error}
          </div>
        )}

        {/* Dynamic Layout: Big Upload/Record Area OR Compact Top Bar */}
        {!file && !isRecording ? (
          <div className="mx-auto w-full max-w-3xl mt-4 sm:mt-8 flex flex-col gap-6">
            {/* Mode Tabs */}
            <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10 shadow-lg shadow-black/20 w-full sm:w-fit mx-auto">
              <button 
                onClick={() => setMode('upload')}
                className={`flex-1 sm:w-48 py-3.5 text-sm font-bold rounded-2xl transition-all ${mode === 'upload' ? 'bg-white/10 shadow-sm text-white' : 'text-neutral-500 hover:text-white'}`}
              >
                ファイルをアップロード
              </button>
              <button 
                onClick={() => setMode('record')}
                className={`flex-1 sm:w-48 flex justify-center items-center gap-2 py-3.5 text-sm font-bold rounded-2xl transition-all ${mode === 'record' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-neutral-500 hover:text-white'}`}
              >
                マイクで録音する
              </button>
            </div>

            {mode === 'upload' ? (
              <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 sm:p-16 relative overflow-hidden group transition-all hover:bg-white/10 shadow-2xl shadow-black/40">
                <input 
                  type="file" 
                  accept="audio/*,video/*" 
                  className="absolute inset-0 cursor-pointer opacity-0 z-10" 
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                  <div className="mb-6 rounded-[32px] bg-emerald-500/20 p-6 sm:p-8 text-emerald-400 ring-1 ring-emerald-500/30 transition-transform group-hover:scale-110">
                    <UploadCloud className="h-12 w-12 sm:h-16 sm:w-16" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">ファイルを選択</h3>
                  <p className="text-neutral-400 text-sm sm:text-base mb-6 max-w-sm">音声や動画をタップして選択するか、ここにドラッグ＆ドロップしてください</p>
                  <div className="text-xs font-bold text-neutral-400 bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                    最大動画/音声サイズ: 25MB
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 sm:p-16 flex flex-col items-center justify-center min-h-[350px] shadow-2xl shadow-black/40">
                <div className="flex flex-col items-center gap-8">
                  <button onClick={startRecording} className="h-28 w-28 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all shadow-xl shadow-emerald-500/10">
                    <Mic className="h-12 w-12" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3">録音を開始</h3>
                    <p className="text-neutral-400 text-sm sm:text-base">ブラウザから直接、あなたの声を録音します。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isRecording ? (
          // Recording in progress mode (centered)
          <div className="mx-auto w-full max-w-3xl mt-4 sm:mt-12">
            <div className="rounded-[40px] border border-red-500/20 bg-red-950/10 p-12 sm:p-20 flex flex-col items-center justify-center shadow-2xl shadow-red-500/10">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-red-500/30 blur-2xl animate-pulse"></div>
                  <button onClick={stopRecording} className="relative h-32 w-32 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-500 hover:bg-red-500/30 transition-all active:scale-95 shadow-xl shadow-red-500/30">
                    <Square className="h-12 w-12 fill-current" />
                  </button>
                </div>
                <div className="text-5xl sm:text-7xl font-mono font-bold text-red-400 tracking-widest drop-shadow-md">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-red-300 font-bold text-sm sm:text-lg text-center flex items-center gap-2">
                  <Radio className="h-5 w-5 animate-pulse" /> マイク録音中... タップして停止
                </p>
              </div>
            </div>
          </div>
        ) : file ? (
          // FILE LOADED - Compact Top Bar
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[28px] bg-white/5 border border-white/10 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 ring-1 ring-emerald-500/30">
                <FileAudio className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="truncate font-bold text-base sm:text-lg">{file.name}</p>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-400 font-medium">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {transcribedText && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> 完了</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
              <button 
                onClick={handleReset}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 px-5 py-3 sm:py-2.5 text-sm font-bold transition-all border border-white/10 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" /> クリア
              </button>
              {!transcribedText && (
                <button 
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 sm:py-2.5 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> 実行中...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" /> 文字起こし開始
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Full-width Transcription Area */}
        {file && !isRecording && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 flex flex-col flex-1 min-h-[500px] h-full shadow-2xl relative">
            <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center justify-between">
              <span>文字起こし結果</span>
              {transcribedText && (
                <button 
                  title="テキストをコピー"
                  onClick={() => navigator.clipboard.writeText(transcribedText)}
                  className="text-xs px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors font-bold shadow-sm active:scale-95 border border-emerald-500/10"
                >
                  結果をコピー
                </button>
              )}
            </h3>
            <div className="flex-1 rounded-2xl bg-black/50 border border-white/5 p-4 sm:p-8 overflow-auto text-sm sm:text-base text-neutral-200 leading-relaxed scrollbar-thin shadow-inner">
              {isTranscribing ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-5 min-h-[200px]">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20 animate-pulse"></div>
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-400 relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-400 font-bold mb-2 text-lg">🤖 OpenAI が音声を解析中...</p>
                    <p className="text-sm text-neutral-500 font-medium">ファイルの長さによっては数秒〜数十秒かかります。<br/>このままお待ちください。</p>
                  </div>
                </div>
              ) : transcribedText ? (
                <div className="whitespace-pre-wrap font-sans text-lg">{transcribedText}</div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center text-neutral-500 text-sm font-medium">
                  上部の「文字起こし開始」ボタンを押してください。
                </div>
              )}
            </div>
            
            {/* TTS Audio Reader Component */}
            {transcribedText && !isTranscribing && (
              <div className="shrink-0 mt-6 md:mt-4 pt-4 border-t border-white/5">
                <AudioReader text={transcribedText} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
