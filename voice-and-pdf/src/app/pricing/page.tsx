"use client";

import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Crown, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { SUBSCRIPTION_MONTHLY_PRICE_YEN } from "@/utils/subscription";

const monthlyPlan = {
  name: "プレミアムプラン",
  amount: SUBSCRIPTION_MONTHLY_PRICE_YEN,
  description:
    "PDF 翻訳と音声読み上げを継続的に使いたい方向けの月額プランです。更新タイミングでクレジットが毎月付与されます。",
  bonuses: [
    "1ヶ月目: 20クレジット",
    "2ヶ月目: 22クレジット",
    "3ヶ月目以降: 25クレジット",
  ],
  notes: [
    "クレジットは更新日に新しい付与量へ置き換わり、繰り越しはできません。",
    "Stripe の安全な決済ページに移動して手続きします。",
    "解約やカード変更は契約後にプラン管理画面から行えます。",
  ],
};

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const subscriptionState = searchParams.get("subscription");

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert(data.error || "Stripe セッションの準備に失敗しました。");
    } catch (error) {
      console.error(error);
      alert("通信エラーが発生しました。少し時間を置いてもう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-sm font-bold text-amber-200">
            <Crown className="h-4 w-4" />
            継続利用向けサブスクリプション
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
            毎月のプランで
            <span className="bg-gradient-to-r from-amber-300 via-white to-sky-300 bg-clip-text text-transparent">
              {" "}
              使い続けやすく
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-400">
            使うほど毎月の付与クレジットが増える設計です。短期の単発利用ではなく、
            継続して使う方向けのプランです。
          </p>
        </div>

        {subscriptionState === "cancelled" && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-neutral-300">
            購入手続きはキャンセルされました。内容を確認してから、必要であれば再度お試しください。
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="mb-2 text-2xl font-black">{monthlyPlan.name}</h2>
                <p className="max-w-xl text-sm leading-relaxed text-neutral-400">
                  {monthlyPlan.description}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-neutral-950/70 px-5 py-4 text-right">
                <p className="text-sm font-bold text-neutral-500">月額料金</p>
                <p className="text-4xl font-black">¥{monthlyPlan.amount.toLocaleString()}</p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                  tax included
                </p>
              </div>
            </div>

            <div className="mb-8 rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-400/10 via-white/5 to-sky-400/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-400/15 p-3 text-amber-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200/80">
                    継続ボーナス
                  </p>
                  <h3 className="text-xl font-black">続けるほど毎月の付与量がアップ</h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {monthlyPlan.bonuses.map((bonus) => (
                  <div
                    key={bonus}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center text-sm font-bold text-neutral-100"
                  >
                    {bonus}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8 space-y-3">
              {monthlyPlan.notes.map((note) => (
                <div key={note} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-base font-black text-neutral-950 transition-all hover:bg-amber-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  決済ページを準備中...
                </>
              ) : (
                <>
                  プレミアムプランを始める
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-neutral-900/80 p-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Before You Start
            </p>
            <h2 className="mb-4 text-2xl font-black">先に確認したいこと</h2>
            <ul className="space-y-4 text-sm leading-relaxed text-neutral-300">
              <li>クレジットは更新日に新しい付与量へ置き換わります。余った分は翌月へ持ち越せません。</li>
              <li>初回の付与も毎月の更新も Stripe Webhook を通して反映されます。</li>
              <li>契約後はプラン管理画面から解約や支払い情報の更新ができます。</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
