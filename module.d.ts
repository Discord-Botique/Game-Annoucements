declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN: string;
    CLIENT_ID: string;
    LOGTAIL_KEY: string;
    SUPABASE_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_DB: string;
    TEST_SERVER_ID?: string;
    DBL_TOKEN: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCH_SUBSCRIPTION_SECRET: string;
  }
}
