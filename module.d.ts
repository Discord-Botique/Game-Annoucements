declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN: string;
    CLIENT_ID: string;
    LOGTAIL_KEY: string;
    SB_KEY: string;
    SB_URL: string;
    SB_DB: string;
    TEST_SERVER_ID?: string;
    DBL_TOKEN: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCH_SUBSCRIPTION_SECRET: string;
    WEBHOOK_URL: string;
  }
}
