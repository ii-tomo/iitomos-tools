# 引継ぎガイド: voice-and-pdf 統合

サブPCで開発した `voice-and-pdf` 機能をメインPCの `iitomoツールズ` へ統合するためのガイドです。

## 1. データベース (Supabase) の準備
メインPCの Supabase プロジェクトに以下のテーブル/カラムがあることを確認してください：
- **`profiles` テーブル**:
    - `id`: (uuid, Auth.users.id と紐付け)
    - `credits_remaining`: (int4, デフォルト: 10)
    - `subscription_plan`: (text, デフォルト: 'free')

## 2. 実装した主要コンポーネント
1.  **クレジット減算・加算ユーティリティ**:
    - [credits.ts](file:///c:/Users/user/my_tool/サブPC/voice-and-pdf/src/utils/credits.ts)
    - `consumeCredits`: AI実行時に呼び出し。
    - `addCredits`: 決済成功時に呼び出し。
2.  **AI連携 API**:
    - `src/app/api/translate/route.ts`
    - `src/app/api/transcribe/route.ts`
    - `src/app/api/tts/route.ts`
    - 既にクレジット消費ロジックが組み込まれています。

## 3. Stripe 統合のポイント
メインPCの既存 Stripe 連携に、以下のロジックを追加してください：
- Stripe Checkout Session の `metadata` に `userId` と `credits`（付与数）を含める。
- Webhook ハンドラ内で、セッション完了時に `addCredits` を呼び出し、残高を更新する。
- 参考実装: [webhooks/stripe/route.ts](file:///c:/Users/user/my_tool/サブPC/voice-and-pdf/src/app/api/webhooks/stripe/route.ts)

## 4. フロントエンド
- `src/components/AuthStatus.tsx` を共通ヘッダーに配置することで、ログイン状態と残高を常に表示できます。
