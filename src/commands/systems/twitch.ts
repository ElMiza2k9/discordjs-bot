import { ApplicationCommandOptionData, Formatters } from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import { ServerModel } from 'models/Server';
import { Twitch } from 'base/Twitch';

export default class implements CommandData {
  public readonly name: string = 'twitch';
  public readonly description: string =
    'Configura las notificaciones de Twitch';
  public readonly options?: ApplicationCommandOptionData[] = [
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
      name: 'add-streamer',
      description: 'Añade un streamer a la lista de notificaciones',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'username',
          description: 'El nombre de usuario de Twitch',
          type: 'STRING',
          required: true
        }
      ]
    },
    {
      name: 'remove-streamer',
      description: 'Elimina un streamer de la lista de notificaciones',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'username',
          description: 'El nombre de usuario de Twitch',
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
            'La plantilla del mensaje. Variables: [channel] [title] [game] [url]',
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
    ephemeral,
    args,
    err
  }: CommandParams) {
    type subcommands =
      | 'toggle'
      | 'channel'
      | 'add-streamer'
      | 'remove-streamer'
      | 'message'
      | 'config';
    const sub = args.getSubcommand() as subcommands;

    if (!command.member.permissions.has('ADMINISTRATOR'))
      return command.reply({
        content: err + 'No tienes permisos para usar este comando',
        ephemeral
      });

    const data =
      (await ServerModel.findById(command.guildId)) ||
      new ServerModel({ _id: command.guildId });

    const handlers = {
      'toggle': async () => {
        const channel = command.guild.channels.cache.get(
          data.twitch.channel || ''
        );

        if (!channel && !data.twitch.enabled)
          return command.reply({
            content:
              err + 'Debes configurar el canal de notificaciones primero',
            ephemeral
          });

        data.twitch.enabled = !data.twitch.enabled;
        await data.save();

        return command.reply({
          content: `¡Has ${
            data.twitch.enabled ? 'activado' : 'desactivado'
          } las notificaciones de Twitch! Agrega algunos canales para notificar.`
        });
      },
      'channel': async () => {
        const channel = args.getChannel('target', true);

        if (channel.id == data.twitch.channel)
          return command.reply({
            content: err + 'El canal ya está configurado',
            ephemeral
          });

        if (
          !channel
            .permissionsFor(client.user.id)
            ?.has(['SEND_MESSAGES', 'EMBED_LINKS'])
        )
          return command.reply({
            content:
              err +
              'No tengo permisos para enviar mensajes/embeds en ese canal',
            ephemeral
          });

        data.twitch.channel = channel.id;
        await data.save();

        return command.reply({
          content: `¡Se ha configurado el canal de notificaciones a ${channel.toString()}!`
        });
      },
      'add-streamer': async () => {
        const username = args.getString('username', true);

        if (data.twitch.streamers.length > 5)
          return command.reply({
            content: err + 'Solo puedes agregar hasta 5 streamers',
            ephemeral
          });

        if (data.twitch.streamers?.includes(username))
          return command.reply({
            content: err + 'El usuario ya está en la lista de notificaciones',
            ephemeral
          });

        const getStreamer = await client.twitch
          .getChannel(username)
          .catch(() => null);

        if (!getStreamer)
          return command.reply({
            content: err + '¡No existe ningún usuario con ese nombre!',
            ephemeral
          });

        data.twitch.streamers = [...data.twitch.streamers, username];
        await data.save();

        return command.reply({
          embeds: [
            {
              color: 0x6441a5,
              author: {
                name: username,
                icon_url: getStreamer.profile_image_url,
                url: `https://twitch.tv/${username}`
              },
              description: getStreamer.description,
              fields: [
                {
                  name: 'Vistas',
                  value: getStreamer.view_count.toLocaleString(),
                  inline: true
                },
                {
                  name: 'Tipo de streamer',
                  value:
                    getStreamer.broadcaster_type == 'partner'
                      ? 'Partner'
                      : getStreamer.broadcaster_type == 'affiliate'
                      ? 'Afiliado'
                      : 'Normal',
                  inline: true
                },
                {
                  name: 'Fecha de creación',
                  value: Formatters.time(
                    ~~(+Date.parse(getStreamer.created_at) / 1000),
                    'R'
                  ),
                  inline: true
                }
              ],
              footer: {
                text: 'Añadido a la lista de notificaciones'
              },
              timestamp: new Date()
            }
          ]
        });
      },
      'remove-streamer': async () => {
        const username = args.getString('username', true);
        if (!data.twitch.streamers?.includes(username))
          return command.reply({
            content: err + 'El usuario no está en la lista de notificaciones',
            ephemeral
          });

        data.twitch.streamers = data.twitch.streamers.filter(
          x => x != username
        );
        await data.save();

        return command.reply({
          content: `¡Ya no recibirás notificaciones de los directos de ${username}!`
        });
      },
      'message': async () => {
        const template = args.getString('template', true);
        if (template.length > 1000)
          return command.reply({
            content: err + 'El mensaje no puede superar los 2000 caracteres',
            ephemeral
          });

        data.twitch.template = template;
        await data.save();

        return command.reply({
          content: `¡Se ha configurado el mensaje de notificaciones!`,
          embeds: [
            {
              description: `${Twitch.replacePlaceholders(template, {
                channel: 'drgatoxd',
                game: 'Just Chatting',
                title: [
                  'REACCIONANDO A MEMES!!!',
                  'jugando juegos jugables owo',
                  'UNBOXING DE PAQUETES DE AMAZON',
                  '🌈 Charlita chill, cuento cosas'
                ][Math.floor(Math.random() * 4)]
              })}`,
              color: 0x6441a5,
              title: 'Vista previa'
            }
          ]
        });
      },
      'config': async () => {
        const channel = command.guild.channels.cache.get(
          data.twitch.channel || ''
        );

        const channelDeleted = !channel && data.twitch.enabled;

        if (!channel && data.twitch.channel) {
          data.twitch.channel = undefined;
          data.twitch.enabled = false;

          await data.save();
        }

        return command.reply({
          content: `Notificaciones de Twitch:`,
          embeds: [
            {
              author: {
                name: 'Configuración de notificaciones de Twitch',
                icon_url: command.guild.iconURL({ dynamic: true }) || undefined
              },
              fields: [
                {
                  name: 'Estado',
                  value: data.twitch.enabled
                    ? 'Activo'
                    : channelDeleted
                    ? 'Inactivo (canal eliminado)'
                    : 'Inactivo'
                },
                {
                  name: 'Canal',
                  value:
                    channel?.toString() ||
                    (channelDeleted ? 'Eliminado' : 'No configurado')
                },
                {
                  name: 'Streamers',
                  value: data.twitch.streamers.length
                    ? data.twitch.streamers.map(x => `> ${x}`).join('\n')
                    : 'Ninguno'
                },
                {
                  name: 'Mensaje',
                  value: data.twitch.template
                }
              ],
              color: 0x6441a5,
              timestamp: new Date()
            }
          ]
        });
      }
    };

    await handlers[sub]();
  }
}
