source .env
npx supabase gen types typescript --db-url "$SUPABASE_DB" > ./utils/supabase.types.ts