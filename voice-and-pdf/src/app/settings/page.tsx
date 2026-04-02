"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getCreditsForContinuousMonths,
  SUBSCRIPTION_MONTHLY_PRICE_YEN,
} from "@/utils/subscription";

type Profile = {
  email: string | null;
  subscription_plan: string;
  subscription_status: string | null;
  credits_remaining: number;
  continuous_months: number | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();
  const successState = searchParams.get("subscription") === "success";

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (authError || !user) {
        setError("ログイン後にプラン管理をご利用ください。");
        setLoading(false);
        return;
      }

      if (successState) {
        try {
          await fetch("/api/subscription-sync", { method: "POST" });
        } catch (syncError) {
          console.error("Subscription sync request failed:", syncError);
        }
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          "email, subscription_plan, subscription_status, credits_remaining, continuous_months, current_period_end, stripe_customer_id",
        )
        .eq("id", user.id)
        .maybeSingle<Profile>();

      if (!active) {
        return;
      }

      if (profileError) {
        console.error("Settings profile fetch error:", profileError);
        setError("プロフィールの読み込みに失敗しました。");
      } else {
        setProfile(data ?? null);
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [successState, supabase]);

  const handlePortalOpen = async () => {
    setPortalLoading(true);

    try {
      const res = await fetch("/api/customer-portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert(data.error || "Stripe カスタマーポータルを開けませんでした。");
    } catch (portalError) {
      console.error(portalError);
      alert("通信エラーが発生しました。");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isPremium = profile?.subscription_plan === "premium";
  const nextMonthlyCredits = getCreditsForContinuousMonths((profile?.continuous_months ?? 0) + 1);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Account & Billing
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight">プラン管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400">
              現在の契約状況、残りクレジット、次回更新の目安を確認できます。契約済みの方は
              Stripe の管理画面へ移動してお支払い情報を変更できます。
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-neutral-200 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {logoutLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                ログアウト中...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                ログアウト
              </>
            )}
          </button>
        </div>

        {successState && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              購入手続きが完了しました。Stripe からの通知後にクレジットが反映されます。数十秒ほどかかる場合があります。
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-8 text-neutral-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            読み込み中...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-sm text-red-100">
            {error}
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-neutral-500">現在のプラン</p>
                  <h2 className="mt-1 text-2xl font-black">
                    {isPremium ? "プレミアムプラン" : "フリープラン"}
                  </h2>
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-sm font-black ${
                    isPremium ? "bg-amber-400 text-neutral-950" : "bg-white/10 text-neutral-300"
                  }`}
                >
                  {isPremium ? profile?.subscription_status ?? "premium" : "free"}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                  <p className="text-sm font-bold text-neutral-500">残りクレジット</p>
                  <p className="mt-2 text-3xl font-black">{profile?.credits_remaining ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5">
                  <p className="text-sm font-bold text-neutral-500">継続月数</p>
                  <p className="mt-2 text-3xl font-black">{profile?.continuous_months ?? 0} ヶ月</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-950/60 p-5 text-sm text-neutral-300">
                <p className="font-bold text-neutral-500">次回更新の目安</p>
                <p className="mt-2">
                  {profile?.current_period_end
                    ? new Date(profile.current_period_end).toLocaleString("ja-JP")
                    : "未設定"}
                </p>
                {isPremium && (
                  <p className="mt-3 text-neutral-400">
                    次回更新時の付与予定クレジット: {nextMonthlyCredits}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-neutral-900/80 p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-300">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-500">月額</p>
                  <h2 className="text-2xl font-black">¥{SUBSCRIPTION_MONTHLY_PRICE_YEN}</h2>
                </div>
              </div>

              <div className="space-y-3 text-sm text-neutral-300">
                <p>1ヶ月目は 20 クレジット、2ヶ月目は 22、3ヶ月目以降は 25 を付与します。</p>
                <p>更新時に残クレジットはリセットされ、毎月の付与量へ置き換わります。</p>
              </div>

              {isPremium && profile?.stripe_customer_id ? (
                <button
                  onClick={handlePortalOpen}
                  disabled={portalLoading}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-neutral-950 transition-all hover:bg-neutral-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {portalLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      ポータルを開いています...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Stripe で契約を管理
                      <ExternalLink className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 text-sm font-black text-neutral-950 transition-all hover:bg-amber-300 active:scale-[0.99]"
                >
                  <Crown className="h-4 w-4" />
                  プレミアムプランを始める
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
