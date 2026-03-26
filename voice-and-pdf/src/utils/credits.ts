import { SupabaseClient } from '@supabase/supabase-js';

/**
 * クレジットを消費する
 * @param supabase Supabase クライアント (サーバーサイド)
 * @param userId ユーザーID
 * @param amount 消費するクレジット量
 * @returns 成功したかどうか
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    // RPC を使用して単一のアトミックな操作で減算することを検討すべきですが、
    // まずはシンプルなロジック（取得 -> 判定 -> 更新）で実装します。
    // ※高トラフィック時は RPC (SQL 関数) が推奨されます。

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile fetch error:', fetchError);
      return { success: false, error: 'プロフィールが見つかりません' };
    }

    if (profile.credits_remaining < amount) {
      return { success: false, error: 'クレジットが不足しています' };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - amount })
      .eq('id', userId)
      .select('credits_remaining')
      .single();

    if (updateError) {
      console.error('Credit update error:', updateError);
      return { success: false, error: 'クレジットの更新に失敗しました' };
    }

    return { 
      success: true, 
      remaining: updatedProfile.credits_remaining 
    };
  } catch (error) {
    console.error('Unexpected error in consumeCredits:', error);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

/**
 * クレジットを追加する (決済成功時など)
 * @param supabase Supabase クライアント (サーバーサイド)
 * @param userId ユーザーID
 * @param amount 追加するクレジット量
 * @returns 成功したかどうか
 */
export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile fetch error:', fetchError);
      return { success: false, error: 'プロフィールが見つかりません' };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining + amount })
      .eq('id', userId)
      .select('credits_remaining')
      .single();

    if (updateError) {
      console.error('Credit update error:', updateError);
      return { success: false, error: 'クレジットの追加に失敗しました' };
    }

    return { 
      success: true, 
      remaining: updatedProfile.credits_remaining 
    };
  } catch (error) {
    console.error('Unexpected error in addCredits:', error);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
