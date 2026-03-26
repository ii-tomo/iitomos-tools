-- ============================================
-- Voice & PDF App: プロファイル & クレジット管理テーブル
-- Supabase SQL Editor で実行してください
-- ============================================

-- 1. profiles テーブル作成
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'premium')),
  credits_remaining numeric not null default 10,
  credits_purchased numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS (Row Level Security) を有効化
alter table public.profiles enable row level security;

-- 3. RLS ポリシー: ユーザーは自分のプロフィールのみ参照・更新可能
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4. 新規ユーザー登録時に自動で profiles レコードを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_plan, credits_remaining)
  values (new.id, new.email, 'free', 10);
  return new;
end;
$$ language plpgsql security definer;

-- トリガー (既存の場合は削除してから再作成)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. updated_at を自動更新する関数
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
