import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/functions/_shared/supabase.types";

export const supabase = createClient<Database>(
  process.env.SB_URL,
  process.env.SB_KEY,
  { auth: { persistSession: false } },
);
