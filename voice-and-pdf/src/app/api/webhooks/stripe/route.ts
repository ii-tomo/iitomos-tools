import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addCredits } from '@/utils/credits';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27-acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook ハンドラ (メインPC統合用テンプレート)
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      console.warn('Webhook signature or secret missing');
      // 開発中やテスト用: 署名検証をスキップしてモックイベントを処理する場合はここを調整
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 決済成功イベントの処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const amount = session.metadata?.credits; // Stripe Checkout時に metadata に追加することを想定

    if (userId && amount) {
      const supabase = await createClient();
      const result = await addCredits(supabase, userId, parseInt(amount));
      
      if (result.success) {
        console.log(`Success: Added ${amount} credits to user ${userId}`);
      } else {
        console.error(`Failed to add credits: ${result.error}`);
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
      }
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
