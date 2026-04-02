-- ============================================
-- Voice & PDF App: Reduce free trial credits
-- New users receive 5 free credits instead of 10
-- ============================================

ALTER TABLE public.profiles
ALTER COLUMN credits_remaining SET DEFAULT 5;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_plan, credits_remaining)
  VALUES (new.id, new.email, 'free', 5);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
