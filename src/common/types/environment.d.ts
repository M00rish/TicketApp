export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      TOKEN_EXPERITION_INSECONDS: number;
      ENV: 'test' | 'dev' | 'prod';
    }
  }
}
