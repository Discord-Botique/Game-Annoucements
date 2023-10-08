source .env
npx supabase gen types typescript --db-url "$SB_DB" > ./supabase/functions/_shared/supabase.types.ts