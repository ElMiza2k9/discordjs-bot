declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DISCORD_TOKEN: string;
      readonly MONGODB_URI: string;
    }
  }
}

export {};
