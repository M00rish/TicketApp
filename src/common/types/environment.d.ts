export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ACCESS_SECRET: string;
      REFRESH_SECRET: string;
      ACCESS_TOKEN_LIFE: string;
      REFRESH_TOKEN_LIFE: string;
      ENV: 'test' | 'dev' | 'prod';
      MONGO_URI: string;
      MONGO_TEST_URI: string;
    }
  }
}
