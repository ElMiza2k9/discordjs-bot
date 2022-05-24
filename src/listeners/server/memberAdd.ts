import type { BotClient } from 'base/Client';
import type { GuildMember, MessageOptions } from 'discord.js';
import type { BotEvents, EventData } from 'types/Event';
import { Welcomer } from 'image-djs';
import { Utilities } from 'base/Util';

export default class implements EventData {
  constructor(public client: BotClient) {}
  public readonly name: keyof BotEvents = 'guildMemberAdd';
  public readonly once: boolean = false;

  public async callback(member: GuildMember) {
    const data = await this.client.fetchServerData(member.guild.id);
    if (!data || !data.welcomer.enabled || !data.welcomer.channel) return;

    const channel = member.guild.channels.cache.get(data.welcomer.channel);
    if (
      !channel ||
      !channel
        .permissionsFor(this.client.user.id)!
        .has(['SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS']) ||
      !channel.isText()
    )
      return;

    const payload: MessageOptions = {};

    if (data.welcomer.type == 'text')
      payload.content = Utilities.replacePlaceholders(
        data.welcomer.template,
        member
      );
    else if (data.welcomer.type == 'embed') {
      payload.embeds = [
        {
          description: Utilities.replacePlaceholders(
            data.welcomer.template,
            member
          ),
          author: {
            name: `👋 ¡Bienvenido ${member.user.tag}!`,
            iconURL: member.guild.iconURL({ dynamic: true }) || undefined
          },
          footer: {
            text: `ID: ${member.id}`
          },
          image: {
            url: `attachment://say-hello-to-${member.id}.png`
          },
          thumbnail: {
            url: member.displayAvatarURL({ dynamic: true })
          },
          color: data.welcomer.color
        }
      ];
    }

    if (data.welcomer.image && data.welcomer.background) {
      const image = await new Welcomer()
        .setAvatar(member.displayAvatarURL({ format: 'png', size: 4096 }))
        .setBackground(Buffer.from(data.welcomer.background, 'base64'))
        .setBorderColor(`#ffffff`)
        .setSubtitle(`☕ Bienvenido a ${member.guild.name}`)
        .setUsername(member.user.tag)
        .build(true, 'say-hello-to-' + member.id + '.png');

      payload.files = [image];
    }

    channel.send(payload).catch(console.error);
  }
}
