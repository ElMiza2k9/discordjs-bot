import type { BotEvents, EventData } from 'types/Event';
import type { BotClient } from 'base/Client';
import { ServerModel } from 'models/Server';
import { Twitch } from 'base/Twitch';
import { TikTok } from 'base/TikTok';
import { MessageActionRow, MessageButton } from 'discord.js';

export default class implements EventData {
  constructor(public client: BotClient) {}

  public readonly name: keyof BotEvents = 'ready';
  public readonly once?: boolean = true;

  public async callback() {
    setInterval(async () => {
      const guilds = await ServerModel.find();
      guilds.forEach(g => {
        if (
          !g.twitch.enabled ||
          !g.twitch.streamers?.length ||
          !g.twitch.channel
        )
          return;

        const channel = this.client.guilds.cache
          .get(g._id)
          ?.channels.cache.get(g.twitch.channel);

        if (
          !channel ||
          !channel.isText() ||
          !channel
            .permissionsFor(this.client.user)!
            .has(['SEND_MESSAGES', 'EMBED_LINKS'])
        )
          return;

        g.twitch.streamers.forEach(async s => {
          const stream = await this.client.twitch
            .getStream(s.toLowerCase())
            .catch(() => null);
          if (!stream) return;

          if (g.twitch.lastStreams.find(x => x.channel == s)?.id == stream.id)
            return;

          const streamer = await this.client.twitch
            .getChannel(s)
            .catch(() => null);
          if (!streamer) return;

          g.twitch.lastStreams = g.twitch.lastStreams.filter(
            x => x.channel != s
          );
          g.twitch.lastStreams.push({
            channel: s,
            id: stream.id
          });

          await g.save();

          await channel
            .send({
              allowedMentions: {
                parse: ['users', 'roles', 'everyone']
              },
              content: Twitch.replacePlaceholders(g.twitch.template, {
                channel: streamer.display_name,
                game: stream.game_name,
                url: `https://twitch.tv/${stream.user_login}`,
                title: stream.title
              }),
              embeds: [
                {
                  image: {
                    url: stream.thumbnail_url
                  },
                  author: {
                    name: `¡${streamer.display_name} está en vivo!`,
                    icon_url: streamer.profile_image_url
                  },
                  title: stream.title,
                  url: `https://twitch.tv/${stream.user_login}`,
                  fields: [
                    {
                      name: 'Juego',
                      value: stream.game_name || 'Desconocido',
                      inline: true
                    },
                    {
                      name: 'Espectadores',
                      value: `${stream.viewer_count}`,
                      inline: true
                    }
                  ],
                  thumbnail: {
                    url: stream.game_art
                  },
                  color: 0x6441a5
                }
              ],
              components: [
                new MessageActionRow({
                  components: [
                    new MessageButton()
                      .setLabel('Ver directo')
                      .setStyle('LINK')
                      .setURL(`https://twitch.tv/${stream.user_login}`)
                  ]
                })
              ]
            })
            .catch(() => null);
        });
      });
    }, 30 * 1000);

    setInterval(async () => {
      const guilds = await ServerModel.find();
      guilds.forEach(g => {
        if (!g.tiktok.enabled || !g.tiktok.users?.length || !g.tiktok.channel)
          return;

        const channel = this.client.guilds.cache
          .get(g._id)
          ?.channels.cache.get(g.tiktok.channel || '');

        if (
          !channel ||
          !channel.isText() ||
          !channel
            .permissionsFor(this.client.user)!
            .has(['SEND_MESSAGES', 'EMBED_LINKS'])
        )
          return;

        g.tiktok.users.forEach(async u => {
          const user = await this.client.tiktok.getUser(u.toLowerCase());

          if (!user.stats || !user.user) return;

          let prev = g.tiktok.infoUsers.find(
            x => x.user == user.user!.uniqueId
          );
          if (!prev) {
            const obj = {
              user: user.user!.uniqueId,
              videoCount: user.stats.videoCount - 1
            };
            g.tiktok.infoUsers.push(obj);
            prev = obj;
          }

          if (user.stats.videoCount <= prev.videoCount!) {
            if (user.stats.videoCount < prev.videoCount!) {
              g.tiktok.infoUsers = g.tiktok.infoUsers.map(x =>
                x.user == user.user!.uniqueId
                  ? { ...x, videoCount: user.stats!.videoCount }
                  : x
              );
              await g.save();
            }

            return;
          }

          g.tiktok.infoUsers = g.tiktok.infoUsers.map(x =>
            x.user == user.user!.uniqueId
              ? { ...x, videoCount: user.stats!.videoCount }
              : x
          );
          await g.save();

          const [video] = await this.client.tiktok.getUserFeed(
            user.user.uniqueId
          );
          if (!video) return;

          await channel
            .send({
              allowedMentions: {
                parse: ['users', 'roles', 'everyone']
              },
              content: TikTok.replacePlaceholders(g.tiktok.template, {
                user: user.user.nickname,
                url: `https://www.tiktok.com/@${user.user.uniqueId}/video/${video.itemInfos.id}`,
                text: video.itemInfos.text,
                music: video.musicInfos.musicName
              }),
              embeds: [
                {
                  image: {
                    url: video.itemInfos.covers[0]
                  },
                  author: {
                    name: `¡${user.user.nickname} ha subido un nuevo video!`,
                    icon_url: user.user.avatarMedium
                  },
                  description: video.itemInfos.text,
                  url: `https://www.tiktok.com/@${user.user.uniqueId}/video/${video.itemInfos.id}`,
                  color: 0xff0050,
                  timestamp: new Date(+video.itemInfos.createTime * 1000),
                  footer: {
                    text: `${video.musicInfos.musicName}`,
                    icon_url: video.musicInfos.covers[0]
                  }
                }
              ],
              components: [
                new MessageActionRow({
                  components: [
                    new MessageButton()
                      .setLabel('Ver video')
                      .setStyle('LINK')
                      .setURL(
                        `https://www.tiktok.com/@${user.user.uniqueId}/video/${video.itemInfos.id}`
                      )
                  ]
                })
              ]
            })
            .catch(() => null);
        });
      });
    }, 60 * 1000);
  }
}
