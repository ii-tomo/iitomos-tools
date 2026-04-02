"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({
        type: "error",
        text: "メールアドレスまたはパスワードが正しくありません。",
      });
    } else {
      window.location.href = "/";
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "パスワードは6文字以上で設定してください。",
      });
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else if (data.session) {
      window.location.href = "/";
    } else {
      setMessage({
        type: "success",
        text: "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。",
      });
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: "Googleログインに失敗しました。" });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/50 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">アカウント</h1>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {mode === "login" ? "おかえりなさい" : "新規アカウント登録"}
            </h2>
            <p className="mt-2 text-sm font-medium text-neutral-400">
              {mode === "login"
                ? "ログインして AI ツールを利用しましょう。"
                : "無料で始められます。初回 5 クレジット付きです。"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 font-bold text-neutral-900 shadow-md transition-colors hover:bg-neutral-100 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleアカウントでログイン
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold text-neutral-500">または</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm font-medium placeholder:text-neutral-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワード（6文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-sm font-medium placeholder:text-neutral-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {message && (
                <div
                  className={`rounded-xl p-3 text-sm font-bold ${
                    message.type === "error"
                      ? "border border-red-500/20 bg-red-500/10 text-red-400"
                      : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === "login" ? (
                  <>
                    <LogIn className="h-5 w-5" />
                    ログイン
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    無料で新規登録
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setMessage(null);
                }}
                className="text-sm font-bold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                {mode === "login"
                  ? "アカウントをお持ちでない方: 新規登録"
                  : "すでにアカウントをお持ちの方: ログイン"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-600">
            登録すると、利用規約およびプライバシーポリシーに同意したものとみなします。
          </p>
        </div>
      </main>
    </div>
  );
}
