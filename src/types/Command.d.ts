import type { BotClient } from 'base/Client';
import type {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver
} from 'discord.js';

export interface CommandData extends ChatInputApplicationCommandData {
  callback: (data: CommandParams) => void;
}

export type CommandParams = {
  client: BotClient;
  command: CommandInteraction<'cached'>;
  args: CommandArgs;
  ephemeral: true;
};

type CommandArgs = Omit<
  CommandInteractionOptionResolver<'cached'>,
  'getMessage' | 'getFocused'
>;
