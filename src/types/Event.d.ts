import type { ClientEvents } from 'discord.js';

export interface EventData {
  name: keyof BotEvents;
  once?: boolean;

  callback: (...args: any[]) => void;
}

export interface BotEvents extends ClientEvents {}
