declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DISCORD_TOKEN: string;
      readonly MONGODB_URI: string;
      readonly TWITCH_SECRET: string;
      readonly TWITCH_ID: string;
    }
  }
}

export {};
