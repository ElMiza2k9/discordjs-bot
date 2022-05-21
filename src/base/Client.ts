import type { CommandData } from 'types/Command';
import { CommandService } from 'services/command.service';
import { Client, Collection } from 'discord.js';
import { options } from 'config';
import { env } from 'process';
import { connect } from 'mongoose';
import { EventService } from 'services/listeners.service';

export class BotClient extends Client<true> {
  public constructor() {
    super(options);
  }

  public commands = new Collection<string, CommandData>();
  public services = {
    command: new CommandService(this),
    event: new EventService(this)
  };

  public async start(token: string = env.DISCORD_TOKEN) {
    if (token?.length) this.token = token;
    else throw new Error('No token provided in .env file.');

    await this.services.command.init();
    await this.services.event.init();
    await super.login();
    await this.connectToMongoDB();
    return this.token || env.DISCORD_TOKEN;
  }

  private async connectToMongoDB() {
    await connect(env.MONGODB_URI)
      .then(() => console.log('Conectado a MongoDB'))
      .catch(console.error);
  }
}
