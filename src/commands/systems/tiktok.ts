import type { ApplicationCommandOptionData } from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import { ServerModel } from 'models/Server';
import { TikTok } from 'base/TikTok';

export default class implements CommandData {
  public name: string = 'tiktok';
  public description: string = 'Configura las notificaciones de TikTok';
  public options?: ApplicationCommandOptionData[] = [
    {
      name: 'toggle',
      description: 'Activa o desactiva las notificaciones de Twitch',
      type: 'SUB_COMMAND'
    },
    {
      name: 'channel',
      description: 'El canal que se usará para notificar',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'target',
          description: 'Selecciona un canal',
          type: 'CHANNEL',
          channelTypes: ['GUILD_TEXT', 'GUILD_NEWS'],
          required: true
        }
      ]
    },
    {
      name: 'add-user',
      description: 'Añade un usuario a la lista de notificaciones',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'username',
          description: 'El nombre de usuario de TikTok',
          type: 'STRING',
          required: true
        }
      ]
    },
    {
      name: 'remove-user',
      description: 'Elimina un usuario de la lista de notificaciones',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'username',
          description: 'El nombre de usuario de TikTok',
          type: 'STRING',
          required: true
        }
      ]
    },
    {
      name: 'message',
      description: 'Configura el mensaje que se enviará',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'template',
          description:
            'La plantilla del mensaje. Variables: [user] [text] [musicName] [url]',
          type: 'STRING',
          required: true
        }
      ]
    },
    {
      name: 'config',
      description: 'Muestra la configuración actual',
      type: 'SUB_COMMAND'
    }
  ];

  public async callback({
    client,
    command,
    args,
    ephemeral,
    err
  }: CommandParams) {
    if (!command.memberPermissions.has('ADMINISTRATOR'))
      return command.reply({
        content: err + 'No tienes permisos para usar este comando.',
        ephemeral
      });

    const serverData =
      (await ServerModel.findById(command.guildId)) ??
      new ServerModel({ _id: command.guildId });

    type subcommand =
      | 'toggle'
      | 'channel'
      | 'add-user'
      | 'remove-user'
      | 'message'
      | 'config';
    const subcommand = args.getSubcommand() as subcommand;

    const functions = {
      async 'toggle'() {
        const channel = command.guild.channels.cache.get(
          serverData.tiktok.channel || ''
        );

        if (!channel && !serverData.tiktok.enabled)
          return command.reply({
            content:
              err + 'Debes configurar el canal de notificaciones primero',
            ephemeral
          });

        serverData.tiktok.enabled = !serverData.tiktok.enabled;
        await serverData.save();

        return command.reply({
          content: `Las notificaciones de TikTok han sido ${
            serverData.tiktok.enabled ? 'activadas' : 'desactivadas'
          }.`
        });
      },
      async 'channel'() {
        const channel = args.getChannel('target', true);
        if (channel.id == serverData.tiktok.channel)
          return command.reply({
            content: err + 'El canal seleccionado ya está configurado.',
            ephemeral
          });

        if (
          !channel
            .permissionsFor(client.user.id)
            ?.has(['SEND_MESSAGES', 'EMBED_LINKS'])
        )
          return command.reply({
            content: err + 'No tienes permisos para usar este canal.',
            ephemeral
          });

        serverData.tiktok.channel = channel.id;
        await serverData.save();

        return command.reply({
          content: `Notificaré los nuevos vídeos en <#${channel.id}>.`
        });
      },
      async 'add-user'() {
        const username = args.getString('username', true);

        if (serverData.tiktok.users.length > 5)
          return command.reply({
            content: err + 'Solo puedes añadir hasta 5 usuarios.',
            ephemeral
          });

        if (serverData.tiktok.users.includes(username)) {
          return command.reply({
            content: err + 'El usuario ya está en la lista.',
            ephemeral
          });
        }

        const fetchUser = await client.tiktok.getUser(username);
        if (!fetchUser.user || !fetchUser.stats)
          return command.reply({
            content: err + 'No se encontró el usuario.',
            ephemeral
          });

        serverData.tiktok.users.push(username);

        if (
          serverData.tiktok.infoUsers.some(
            u => u.user == fetchUser.user?.uniqueId
          )
        ) {
          serverData.tiktok.infoUsers = serverData.tiktok.infoUsers.map(u =>
            u.user == fetchUser.user?.uniqueId
              ? { ...u, videoCount: fetchUser.stats?.videoCount }
              : u
          );
        } else {
          serverData.tiktok.infoUsers.push({
            user: username,
            videoCount: fetchUser.stats.videoCount
          });
        }

        await serverData.save();

        return command.reply({
          embeds: [
            {
              author: {
                name: `${fetchUser.user?.nickname} (@${fetchUser.user?.uniqueId})`,
                icon_url: fetchUser.user?.avatarMedium,
                url: `https://www.tiktok.com/@${fetchUser.user?.uniqueId}`
              },
              description: fetchUser.user?.signature,
              footer: {
                text: 'Te has suscrito a las notificaciones de este usuario.'
              },
              fields: [
                {
                  name: 'Seguidores',
                  value: fetchUser.stats?.followerCount.toLocaleString('en-US'),
                  inline: true
                },
                {
                  name: 'Corazones',
                  value: fetchUser.stats?.heartCount.toLocaleString('en-US'),
                  inline: true
                },
                {
                  name: 'Vídeos',
                  value: fetchUser.stats?.videoCount.toLocaleString('en-US'),
                  inline: true
                }
              ],
              color: 0xff0050,
              thumbnail: {
                url: fetchUser.user?.avatarMedium
              },
              timestamp: new Date()
            }
          ]
        });
      },
      async 'remove-user'() {
        const username = args.getString('username', true);

        if (!serverData.tiktok.users.includes(username))
          return command.reply({
            content: err + 'El usuario no está en la lista.',
            ephemeral
          });

        serverData.tiktok.users = serverData.tiktok.users.filter(
          user => user != username
        );
        await serverData.save();

        return command.reply({
          content: `Ya no recibirás notificaciones de [${username}](https://www.tiktok.com/@${username}).`
        });
      },
      async 'message'() {
        const template = args.getString('template', true);
        if (template.length > 1000)
          return command.reply({
            content: err + `El mensaje no puede tener más de 2000 caracteres.`,
            ephemeral
          });

        serverData.tiktok.template = template;
        await serverData.save();

        return command.reply({
          content: `El mensaje ha sido configurado.`,
          embeds: [
            {
              color: 0xff0050,
              title: 'Vista previa',
              description: TikTok.replacePlaceholders(template, {
                music: [
                  'Enemy - from the series Arcane League of Legends - Imagine Dragons & JID & Arcane & League Of Legends',
                  'El Arbolito - Grupo Nectar',
                  'Malibu - Miley Cyrus',
                  'sonido original - Inca Kola',
                  'sonido original - Random videos and memes'
                ][Math.floor(Math.random() * 5)],
                user: 'drgato785',
                text: [
                  `#fyp #xdd #meme #funnyvideos #newmemes #foryoupage #bruh`,
                  'Una realidad diaria #espaciojuridico #peru🇵🇪 #parati #delincuencia',
                  '#parati #peru #breakingbad #fyp #fyp',
                  'Parte 17 memes random #memes #random #viral #parati'
                ][Math.floor(Math.random() * 4)],
                url: 'https://www.tiktok.com/@erickpunk666/video/6989380633248337158'
              })
            }
          ]
        });
      },
      async 'config'() {
        const channel = command.guild.channels.cache.get(
          serverData.tiktok.channel || ''
        );

        const channelDeleted = !channel && serverData.tiktok.enabled;

        if (!channel && serverData.tiktok.channel) {
          serverData.tiktok.channel = undefined;
          serverData.tiktok.enabled = false;

          await serverData.save();
        }

        return command.reply({
          embeds: [
            {
              color: 0xff0050,
              author: {
                name: 'Configuración de notificaciones de TikTok',
                icon_url: command.guild.iconURL({ dynamic: true }) || undefined
              },
              fields: [
                {
                  name: 'Estado',
                  value: serverData.tiktok.enabled
                    ? 'Activo'
                    : channelDeleted
                    ? 'Inactivo (el canal ha sido eliminado)'
                    : 'Inactivo'
                },
                {
                  name: 'Canal',
                  value:
                    channel?.toString() ||
                    (channelDeleted ? 'Eliminado' : 'Sin configurar')
                },
                {
                  name: 'Susscripciones',
                  value: serverData.tiktok.users.length
                    ? serverData.tiktok.users.map(x => `> ${x}`).join('\n')
                    : 'Ninguna'
                },
                {
                  name: 'Mensaje',
                  value: serverData.tiktok.template
                }
              ],
              timestamp: new Date()
            }
          ]
        });
      }
    };

    await functions[subcommand]();
  }
}
