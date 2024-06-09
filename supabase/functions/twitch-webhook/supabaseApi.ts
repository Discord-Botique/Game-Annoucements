import { createClient } from "supabase";
import type { Database } from "../../db.types";

export const getSubscriptions = async (user_id: string) => {
  const sbURL = Deno.env.get("SUPABASE_URL");
  const sbKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!sbURL || !sbKey) return [];

  const supabase = createClient<Database>(sbURL, sbKey, {
    auth: { persistSession: false },
  });

  const subscriptions = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({ user_id });

  return subscriptions.data ?? [];
};
