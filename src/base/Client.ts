import type { CommandData } from 'types/Command';
import { CommandService } from 'services/command.service';
import {
  Client,
  Collection,
  Intents,
  type TextChannel,
  type VoiceChannel
} from 'discord.js';
import { options } from 'config';
import { env } from 'process';
import { connect } from 'mongoose';
import { EventService } from 'services/listeners.service';
import { ServerModel } from 'models/Server';
import { Twitch } from 'base/Twitch';
import { TikTok } from 'base/TikTok';

export class BotClient extends Client<true> {
  public constructor() {
    super(options);
  }

  public tiktok = new TikTok();
  public twitch = new Twitch(env.TWITCH_ID, env.TWITCH_SECRET);
  public activeVoiceChannels = new Collection<string, VoiceChannel>();
  public activeTextChannels = new Collection<string, TextChannel>();
  public commands = new Collection<string, CommandData>();
  public services = {
    command: new CommandService(this),
    event: new EventService(this)
  };

  public async start(token: string = env.DISCORD_TOKEN) {
    if (token?.length) this.token = token;
    else throw new Error('No token provided in .env file.');

    console.log(`Intents activos: ${new Intents(options.intents).toArray()}`);

    await this.twitch.getKey();
    await this.services.command.init();
    await this.services.event.init();
    await super.login();
    await this.connectToMongoDB();
    return this.token || env.DISCORD_TOKEN;
  }

  public async fetchServerData(id: string) {
    return (await ServerModel.findById(id)) || new ServerModel({ _id: id });
  }

  private async connectToMongoDB() {
    await connect(env.MONGODB_URI)
      .then(() => console.log('Conectado a MongoDB'))
      .catch(console.error);
  }
}
