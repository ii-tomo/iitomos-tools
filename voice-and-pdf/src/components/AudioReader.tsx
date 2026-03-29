"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, Volume2, Sparkles, Monitor } from "lucide-react";

type VoiceEngine = "browser" | "ai";

interface AudioReaderProps {
  text: string;
}

export function AudioReader({ text }: AudioReaderProps) {
  const [engine, setEngine] = useState<VoiceEngine>("browser");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Clean up playback when text or engine changes or component unmounts
  useEffect(() => {
    stopPlayback();
    return () => stopPlayback();
  }, [engine, text]);

  const stopPlayback = () => {
    setIsPlaying(false);
    setIsLoading(false);
    // Stop Browser Speech API
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    // Stop any AI audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playBrowserTTS = () => {
    if (!("speechSynthesis" in window)) {
      alert("お使いのブラウザは標準機能での音声読み上げに対応していません。");
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Simple heuristic to detect Japanese text for language selection
    utterance.lang = text.match(/[ぁ-んァ-ヶ亜-熙]/) ? "ja-JP" : "en-US";
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const playAITTS = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        if (res.status === 402) {
          window.dispatchEvent(new CustomEvent('show_insufficient_modal'));
          throw new Error("INSUFFICIENT_CREDITS");
        }
        throw new Error("TTS generation failed");
      }

      const creditsHeader = res.headers.get("X-Credits-Remaining");
      if (creditsHeader) {
        window.dispatchEvent(new CustomEvent('credits_updated', { detail: { credits: parseInt(creditsHeader, 10) } }));
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = url;
      audioRef.current.onended = () => setIsPlaying(false);
      
      setIsLoading(false);
      setIsPlaying(true);
      audioRef.current.play();
      
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      setIsPlaying(false);
      if (error.message !== "INSUFFICIENT_CREDITS") {
        alert("AI音声の生成に失敗しました。");
      }
    }
  };

  const toggleEngine = () => {
    if (isPlaying || isLoading) stopPlayback();
    setEngine(prev => prev === "browser" ? "ai" : "browser");
  };

  const handlePlay = () => {
    if (!text.trim()) return;
    if (isPlaying || isLoading) {
      stopPlayback();
      return;
    }

    if (engine === "browser") {
      playBrowserTTS();
    } else {
      playAITTS();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-medium text-neutral-300 w-full sm:w-auto mb-1 sm:mb-0">
          <Volume2 className="h-5 w-5 text-indigo-400" />
          <span>音声読み上げ (TTS)</span>
        </div>
        
        {/* Engine Toggle */}
        <button
          onClick={toggleEngine}
          className="relative flex items-center rounded-full border border-white/10 bg-neutral-950 p-1 w-full sm:w-fit overflow-hidden"
        >
          <div className={`relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${engine === "browser" ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Monitor className="h-3 w-3" />
            標準 (無料)
          </div>
          <div className={`relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${engine === "ai" ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Sparkles className="h-3 w-3" />
            AI (高音質)
          </div>
          {/* Toggle Background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-in-out ${
              engine === "browser" ? "left-1 bg-neutral-700" : "left-[calc(50%+3px)] bg-indigo-500"
            }`}
          />
        </button>
      </div>

      <div>
        <button
          onClick={handlePlay}
          disabled={!text.trim() && !isPlaying}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-bold transition-all shadow-sm ${
            !text.trim() && !isPlaying
              ? "cursor-not-allowed bg-white/5 text-neutral-600 border border-white/5"
              : isLoading
              ? "cursor-wait bg-indigo-500/50 text-white"
              : isPlaying
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              : "bg-white text-neutral-900 hover:bg-neutral-200"
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              AI音声を生成中...
            </>
          ) : isPlaying ? (
            <>
              <Square className="h-5 w-5 fill-current" />
              読み上げを停止
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" />
              読み上げる
            </>
          )}
        </button>
        
        {engine === "ai" && !isPlaying && !isLoading && (
          <p className="mt-2 text-center text-xs font-medium text-neutral-500">
            ※AI音声はAPI連携により数秒の生成時間がかかります
          </p>
        )}
      </div>
    </div>
  );
}
