import { SupabaseClient } from "@supabase/supabase-js";

export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number = 1,
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      console.error("Profile fetch error:", fetchError);
      return { success: false, error: "プロフィールが見つかりません。" };
    }

    if (profile.credits_remaining < amount) {
      return { success: false, error: "クレジットが不足しています。" };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ credits_remaining: profile.credits_remaining - amount })
      .eq("id", userId)
      .select("credits_remaining")
      .single();

    if (updateError) {
      console.error("Credit update error:", updateError);
      return { success: false, error: "クレジット更新に失敗しました。" };
    }

    return {
      success: true,
      remaining: updatedProfile.credits_remaining,
    };
  } catch (error) {
    console.error("Unexpected error in consumeCredits:", error);
    return { success: false, error: "予期しないエラーが発生しました。" };
  }
}

export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      console.error("Profile fetch error:", fetchError);
      return { success: false, error: "プロフィールが見つかりません。" };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ credits_remaining: profile.credits_remaining + amount })
      .eq("id", userId)
      .select("credits_remaining")
      .single();

    if (updateError) {
      console.error("Credit update error:", updateError);
      return { success: false, error: "クレジット追加に失敗しました。" };
    }

    return {
      success: true,
      remaining: updatedProfile.credits_remaining,
    };
  } catch (error) {
    console.error("Unexpected error in addCredits:", error);
    return { success: false, error: "予期しないエラーが発生しました。" };
  }
}
