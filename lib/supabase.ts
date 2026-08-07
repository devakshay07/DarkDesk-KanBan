import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project"))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase && typeof window !== "undefined") {
  console.warn("[DarkDesk] Supabase is not configured. Running in local-only mode. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable cloud sync.");
}

export async function deleteCardFromSupabase(cardId: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("cards").delete().eq("id", cardId);
    if (error) console.error("Supabase delete error:", error);
  } catch (err) {
    console.error("Supabase connection error:", err);
  }
}
