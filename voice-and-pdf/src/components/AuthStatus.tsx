"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import Link from "next/link";
import { Coins, CreditCard, Crown, Loader2, LogIn, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  subscription_plan: string;
  subscription_status?: string | null;
  credits_remaining: number;
}

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_status, credits_remaining")
        .eq("id", userId)
        .maybeSingle<Profile>();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Supabase profile fetch error:", error);
        return;
      }

      setProfile(data ?? null);
    };

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth get session error:", error);
        }

        if (!isMounted) {
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Unexpected auth init error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const handleCreditsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ credits: number }>;
      setProfile((prev) =>
        prev ? { ...prev, credits_remaining: customEvent.detail.credits } : null,
      );
    };

    const handleInsufficientModal = () => {
      setShowInsufficientModal(true);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (!isMounted) {
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    window.addEventListener("credits_updated", handleCreditsUpdate);
    window.addEventListener("show_insufficient_modal", handleInsufficientModal);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("credits_updated", handleCreditsUpdate);
      window.removeEventListener("show_insufficient_modal", handleInsufficientModal);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/";
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">ログイン</span>
        <span className="sm:hidden">入る</span>
      </Link>
    );
  }

  const isPremium = profile?.subscription_plan === "premium";
  const planLabel =
    isPremium && profile?.subscription_status
      ? `プレミアム / ${profile.subscription_status}`
      : isPremium
        ? "プレミアム"
        : "フリー";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-2 pl-3 pr-3 text-sm font-bold text-neutral-200 transition-all hover:bg-white/20 active:scale-95 sm:pr-4"
      >
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${
            isPremium
              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
              : "bg-white/10 text-neutral-400"
          }`}
        >
          {isPremium ? <Crown className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
          {profile?.credits_remaining ?? 0}
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-black text-indigo-300 ring-1 ring-indigo-500/40">
          {user.email?.[0]?.toUpperCase() || "?"}
        </div>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
            <div className="border-b border-white/5 p-4">
              <p className="mb-1 text-xs font-bold text-neutral-500">ログイン中</p>
              <p className="truncate text-sm font-medium text-neutral-200">{user.email}</p>
            </div>

            <div className="border-b border-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">プラン</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    isPremium ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-neutral-400"
                  }`}
                >
                  {planLabel}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">
                  {profile?.credits_remaining ?? 0}
                </span>
                <span className="text-xs font-bold text-neutral-500">credits</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-2">
              {!isPremium && (
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/10"
                >
                  <Crown className="h-4 w-4" />
                  プレミアムプランを見る
                </Link>
              )}

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-300 transition-colors hover:bg-white/5"
              >
                <CreditCard className="h-4 w-4 text-indigo-400" />
                プラン管理
              </Link>

              <button
                onClick={handleLogout}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {showInsufficientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInsufficientModal(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-500/20 p-4 text-red-400 ring-1 ring-red-500/30">
                <Coins className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">クレジットが不足しています</h3>
              <p className="mb-8 text-sm text-neutral-400">
                AI 機能を使うにはクレジットが必要です。必要に応じてプレミアムプランに加入すると、
                毎月クレジットが付与されます。
              </p>

              <Link
                href="/pricing"
                onClick={() => setShowInsufficientModal(false)}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-95"
              >
                <Crown className="h-4 w-4" />
                プランを見る
              </Link>
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="text-xs font-bold text-neutral-500 transition-colors hover:text-neutral-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
