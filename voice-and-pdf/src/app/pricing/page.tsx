"use client";

import { CreditCard, Sparkles, Check, ArrowRight } from "lucide-react";
import { useState } from "react";

const pricingPlans = [
  {
    name: "お試しクレジット",
    amount: 1000,
    credits: 10,
    description: "AI翻訳や文字起こしを少し試してみたい方に最適です。",
    color: "indigo"
  },
  {
    name: "スタンダード補充",
    badge: "人気",
    amount: 3000,
    credits: 35,
    description: "定期的にAIツールを利用する方向け。15%お得なパッケージです。",
    color: "emerald"
  },
  {
    name: "プロフェッショナル",
    amount: 8000,
    credits: 100,
    description: "大量のドキュメントや音声を処理する方に。20%お得なプランです。",
    color: "amber"
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (plan: typeof pricingPlans[0]) => {
    setLoading(plan.name);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          credits: plan.credits
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("エラーが発生しました: " + (data.error || "決済セッションを作成できませんでした。"));
      }
    } catch (err) {
      console.error(err);
      alert("通信エラーが発生しました。");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-4 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
            クレジットのチャージ
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            AI翻訳や文字起こしツールを無制限に活用しましょう。
            必要な分だけ、いつでも追加可能です。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-3xl border border-white/10 bg-white/5 transition-all hover:bg-white/10 shadow-xl`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20 uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black">¥{plan.amount.toLocaleString()}</span>
                  <span className="text-sm text-neutral-500 font-bold">税込</span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed min-h-[3rem]">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 mb-8">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 mb-6`}>
                  <Sparkles className={`h-5 w-5 ${plan.color === 'indigo' ? 'text-indigo-400' : plan.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-lg font-black">{plan.credits} クレジット</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-neutral-300">
                    <Check className="h-4 w-4 text-neutral-500" />
                    有効期限なし
                  </li>
                  <li className="flex items-center gap-3 text-sm text-neutral-300">
                    <Check className="h-4 w-4 text-neutral-500" />
                    全AIツールで利用可能
                  </li>
                  <li className="flex items-center gap-3 text-sm text-neutral-300">
                    <Check className="h-4 w-4 text-neutral-500" />
                    優先サポート
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handlePurchase(plan)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  plan.badge 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
                } disabled:opacity-50`}
              >
                {loading === plan.name ? (
                  <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    購入する
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-neutral-500 font-medium">
            ※ 購入したクレジットの返金はできませんのでご了承ください。<br />
            ※ 決済は Stripe を通じて安全に行われます。
          </p>
        </div>
      </div>
    </div>
  );
}
