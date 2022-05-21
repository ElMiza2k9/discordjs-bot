import type { BotClient } from 'base/Client';
import { messages } from 'config';
import type { CommandInteraction } from 'discord.js';
import type { CommandData } from 'types/Command';
import { sync as glob } from 'glob';
import { join } from 'path';

const ephemeral = true;

export class CommandService {
  public constructor(private client: BotClient) {}

  public async init() {
    const slashCommands: CommandData[] = [];
    const files = glob(`./src/commands/**/*{.ts,.js}`);

    for (const file of files) {
      const Command = require(join(process.cwd(), file)).default;
      const cmd = new Command();
      slashCommands.push(cmd);
      this.client.commands.set(cmd.name, cmd);
    }

    this.client.once('ready', async () => {
      await this.client.application.commands
        .set(slashCommands)
        .then(() => console.log(`${slashCommands.length} commands loaded`));
    });

    this.client.on('interactionCreate', int => {
      if (!int.inCachedGuild()) return;
      if (int.isCommand()) this.handle(int);
    });

    return void 0;
  }

  public async handle(cmd: CommandInteraction<'cached'>) {
    const command = this.getCommand(cmd.commandName);

    if (!command) {
      return cmd.reply({ content: messages.commandNotFound, ephemeral });
    }

    return command.callback({
      client: this.client,
      command: cmd,
      args: cmd.options,
      ephemeral
    });
  }

  public getCommand(name: string) {
    return this.client.commands.get(name);
  }
}
