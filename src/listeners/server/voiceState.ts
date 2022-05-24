import type { VoiceState } from 'discord.js';
import type { BotEvents, EventData } from 'types/Event';
import { ServerModel } from 'models/Server';
import type { BotClient } from 'base/Client';

export default class implements EventData {
  public constructor(public client: BotClient) {}

  public name: keyof BotEvents = 'voiceStateUpdate';
  public once: boolean = false;

  public async callback(oldState: VoiceState, newState: VoiceState) {
    if (
      !newState.guild ||
      !newState.member ||
      oldState.channelId == newState.channelId ||
      !newState.guild.me?.permissions.has('MANAGE_CHANNELS')
    )
      return;

    const data = await ServerModel.findById(newState.guild.id);
    if (!data || !data.jtc.channel) return;

    const key = `${newState.guild.id}-${oldState.channelId}`;
    const channel = this.client.activeVoiceChannels.get(key);

    if (newState.channelId == data.jtc.channel) {
      const parent = data.jtc.parent
        ? newState.guild.channels.cache.get(data.jtc.parent)
        : undefined;

      await newState.guild.channels
        .create(
          data.jtc.template.replace('{name}', newState.member.displayName),
          {
            type: 'GUILD_VOICE',
            parent: parent?.id
          }
        )
        .then(async c => {
          const failed = await newState
            .member!.voice.setChannel(c)
            .then(() => false)
            .catch(() => false);

          if (failed) return;

          this.client.activeVoiceChannels.set(
            `${newState.guild.id}-${c.id}`,
            c
          );

          if (data.jtc.textChannel)
            await newState.guild.channels
              .create(
                data.jtc.textTemplate.replace(
                  '{name}',
                  newState.member!.displayName
                ),
                {
                  type: 'GUILD_TEXT',
                  parent: parent?.id,
                  rateLimitPerUser: 1
                }
              )
              .then(tc => {
                this.client.activeTextChannels.set(
                  `${newState.guild.id}-${c.id}`,
                  tc
                );
              })
              .catch(() => null);
        })
        .catch(() => null);
    }

    if (channel && !channel.members.size) {
      channel.delete().catch(() => null);
      this.client.activeVoiceChannels.delete(key);

      const textChannel = this.client.activeTextChannels.get(key);
      if (textChannel) {
        textChannel.delete().catch(() => null);
        this.client.activeTextChannels.delete(key);
      }
    }
  }
}
