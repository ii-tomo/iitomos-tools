-- ============================================
-- Voice & PDF App: サブスクリプション & 継続ボーナス管理
-- profiles テーブルの拡張用 Migration
-- ============================================

-- profiles テーブルにサブスクリプション管理用のカラムを追加
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS continuous_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_bonus_applied_at TIMESTAMP WITH TIME ZONE;
