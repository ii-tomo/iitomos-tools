import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addCredits } from '@/utils/credits';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27-acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook ハンドラ
 * 決済成功時にメタデータから userId と credits を取得し、Supabase の残高を更新します。
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      // 署名検証用のシークレットがない場合はエラー（セキュリティのため）
      console.error('Webhook signature or secret missing');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 決済成功イベント (checkout.session.completed) の処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = session.metadata?.credits;

    if (userId && credits) {
      const supabase = await createClient();
      const result = await addCredits(supabase, userId, parseInt(credits));
      
      if (result.success) {
        console.log(`[Webhook] Success: Added ${credits} credits to user ${userId}`);
      } else {
        console.error(`[Webhook] Failed to add credits: ${result.error}`);
        // ここでエラーを返すと Stripe がリトライしてくれます
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
      }
    } else {
      console.warn('[Webhook] Missing metadata in session:', session.id);
    }
  }

  return NextResponse.json({ received: true });
}

/* 
  [統合時のヒント]
  1. メインPC側の既存 Webhook ハンドラがある場合は、このファイルを参考に `addCredits` の呼び出し部分を移植してください。
  2. Stripe Checkout Session 作成時に、以下のように metadata を含める必要があります：
     metadata: {
       userId: user.id,
       credits: "100" // 付与するクレジット数
     }
*/
