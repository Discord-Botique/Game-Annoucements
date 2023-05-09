declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN: string;
    CLIENT_ID: string;
    LOGTAIL_KEY: string;
    SUPABASE_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_DB: string;
    TEST: string;
    TEST_SERVER_ID: string;
  }
}
