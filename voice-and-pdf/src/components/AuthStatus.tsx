"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn, LogOut, CreditCard, Loader2, Coins, Crown } from "lucide-react";

interface Profile {
  subscription_plan: string;
  credits_remaining: number;
}

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_plan, credits_remaining")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Supabase Profile Fetch Error:", error);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. マウント時に確実に現在のユーザー情報を取得してローディングを解除する
    // getUser() はネットワーク通信＋Web Lockを使うためページごとにフリーズする。
    // getSession() はローカルキャッシュを読むだけなのでロック競合が起きない。
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("Auth get session error:", error);
        
        if (!isMounted) return;
        
        const user = session?.user ?? null;
        setUser(user);
        if (user) {
          await fetchProfile(user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Unexpected auth init error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSession();


    // 2. 以降のログイン・ログアウトなどの状態変化を監視する
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (!isMounted) return;
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      }
    });

    const handleCreditsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ credits: number }>;
      setProfile(prev => prev ? { ...prev, credits_remaining: customEvent.detail.credits } : null);
    };

    const handleInsufficientModal = () => {
      setShowInsufficientModal(true);
    };

    window.addEventListener('credits_updated', handleCreditsUpdate);
    window.addEventListener('show_insufficient_modal', handleInsufficientModal);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('credits_updated', handleCreditsUpdate);
      window.removeEventListener('show_insufficient_modal', handleInsufficientModal);
    };
  }, []);

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
        className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-500/20"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">ログイン</span>
        <span className="sm:hidden">入る</span>
      </Link>
    );
  }

  const isPremium = profile?.subscription_plan === "premium";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 pl-3 pr-3 sm:pr-4 py-2 text-sm font-bold text-neutral-200 transition-all border border-white/10 active:scale-95"
      >
        {/* Credits Badge */}
        <div className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full ${isPremium ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/10 text-neutral-400'}`}>
          {isPremium ? <Crown className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
          {profile?.credits_remaining ?? 0}
        </div>
        {/* Avatar */}
        <div className="h-6 w-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-black ring-1 ring-indigo-500/40">
          {user.email?.[0]?.toUpperCase() || "?"}
        </div>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-white/5">
              <p className="text-xs text-neutral-500 font-bold mb-1">ログイン中</p>
              <p className="text-sm text-neutral-200 font-medium truncate">{user.email}</p>
            </div>

            {/* Credit Info */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500 font-bold">残りクレジット</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isPremium ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-neutral-400'}`}>
                  {isPremium ? '👑 プレミアム' : '🆓 無料プラン'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{profile?.credits_remaining ?? 0}</span>
                <span className="text-xs text-neutral-500 font-bold">クレジット</span>
              </div>
              {!isPremium && (
                <div className="mt-3">
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, ((profile?.credits_remaining ?? 0) / 10) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2 flex flex-col gap-1">
              {!isPremium && (
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors"
                >
                  <Crown className="h-4 w-4" />
                  プレミアムにアップグレード
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-300 hover:bg-white/5 rounded-xl transition-colors"
              >
                <CreditCard className="h-4 w-4 text-indigo-400" />
                プラン＆クレジット
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        </>
      )}

      {/* Insufficient Credits Modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInsufficientModal(false)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-500/20 p-4 text-red-500 ring-1 ring-red-500/30">
                <Coins className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">クレジットが不足しています</h3>
              <p className="mb-8 text-sm text-neutral-400">
                AI機能をご利用いただくためのクレジットが0になりました。继续して利用するにはチャージまたはプランをアップグレードしてください。
              </p>
              
              <Link
                href="/pricing"
                onClick={() => setShowInsufficientModal(false)}
                className="w-full flex justify-center items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-500/20 mb-3"
              >
                <Crown className="h-4 w-4" />
                プランとクレジットを見る
              </Link>
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                あとで
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
