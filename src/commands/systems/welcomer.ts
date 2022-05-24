import type { ApplicationCommandOptionData } from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import axios from 'axios';
import { Utilities } from 'base/Util';

export default class implements CommandData {
  public readonly name: string = 'welcomer';
  public readonly description: string = 'Configura el sistema de bienvenida';
  public readonly options?: ApplicationCommandOptionData[] = [
    {
      name: 'toggle',
      description: 'Activa/desactiva el sistema de bienvenida',
      type: 'BOOLEAN'
    },
    {
      name: 'channel',
      description: 'El canal que se usará para crear canales de voz',
      type: 'CHANNEL',
      channelTypes: ['GUILD_TEXT', 'GUILD_NEWS']
    },
    {
      name: 'type',
      description: 'El tipo de mensaje que se usará',
      type: 'STRING',
      choices: [
        { name: 'embed', value: 'embed' },
        { name: 'text', value: 'text' }
      ]
    },
    {
      name: 'template',
      description: 'El template que se usará para crear el mensaje',
      type: 'STRING'
    },
    {
      name: 'image',
      description: '¿Usar imagen en el mensaje?',
      type: 'BOOLEAN'
    },
    {
      name: 'background',
      description: 'La imagen de fondo del mensaje',
      type: 'STRING'
    },
    {
      name: 'color',
      description: 'El color del mensaje embed',
      type: 'STRING'
    }
  ];

  public async callback({ client, command, ephemeral, args }: CommandParams) {
    if (!command.memberPermissions.has('ADMINISTRATOR'))
      return command.reply({
        content: 'No tienes permisos para usar este comando',
        ephemeral
      });

    const data = await client.fetchServerData(command.guildId);

    const toggle = args.getBoolean('toggle');
    const channel = args.getChannel('channel');
    const type = args.getString('type') as 'embed' | 'text';
    const template = args.getString('template');
    const image = args.getBoolean('image');
    const background = args.getString('background');
    const color = args.getString('color') as `#${string}`;

    if (typeof toggle == 'boolean') data.welcomer.enabled = toggle;

    if (channel) {
      if (
        !channel
          .permissionsFor(client.user.id)!
          .has(['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'])
      )
        return command.reply({
          content:
            'No tengo permiso para enviar mensajes/embeds/archivos en el canal seleccionado',
          ephemeral
        });

      data.welcomer.channel = channel.id;
    }

    if (type) data.welcomer.type = type;
    if (template) {
      if (template.length > 500)
        return command.reply({
          content: 'El template no puede tener más de 500 caracteres',
          ephemeral
        });
      data.welcomer.template = template;
    }

    if (typeof image == 'boolean') data.welcomer.image = image;

    if (background) {
      const res = await axios
        .get(background, { responseType: 'arraybuffer' })
        .catch(() => null);

      if (!res)
        return command.reply({
          content: 'No se pudo cargar la imagen de fondo',
          ephemeral
        });

      // check if response is an jpeg | png | jpg
      if (
        res.headers['content-type'] &&
        !['image/jpeg', 'image/png', 'image/jpg'].includes(
          res.headers['content-type']
        )
      )
        return command.reply({
          content:
            'La imagen seleccionada no es válida (solo archivos jpg/png/jpeg)',
          ephemeral
        });

      data.welcomer.backgroundURL = background;
      data.welcomer.background = Buffer.from(res.data).toString('base64');
    }

    if (color) {
      if (!Utilities.checkHexColor(color))
        return command.reply({
          content:
            'El color seleccionado no es válido. Solo se permiten colores hexadecimales',
          ephemeral
        });

      data.welcomer.color = color;
    }

    if (data.welcomer.channel) {
      const guildChannel = command.guild.channels.cache.get(
        data.welcomer.channel
      );
      if (!guildChannel) data.welcomer.channel = undefined;
    }

    if (
      data.welcomer.backgroundURL &&
      data.welcomer.backgroundURL != background
    ) {
      const res = await axios
        .get(data.welcomer.backgroundURL, { responseType: 'arraybuffer' })
        .catch(() => null);

      if (
        !res ||
        (res.headers['content-type'] &&
          !['image/jpeg', 'image/png', 'image/jpg'].includes(
            res.headers['content-type']
          ))
      ) {
        data.welcomer.backgroundURL = undefined;
        data.welcomer.background = undefined;
      }
    }
    await data.updateOne(data);

    return command.reply({
      embeds: [
        {
          author: {
            name: 'Sistema de bienvenida',
            icon_url: command.guild.iconURL({ dynamic: true }) || undefined
          },
          fields: [
            {
              name: 'Estado',
              value: data.welcomer.enabled ? 'Activo' : 'Desactivado'
            },
            {
              name: 'Canal',
              value: data.welcomer.channel
                ? `<#${data.welcomer.channel}>`
                : 'Desconocido/No establecido'
            },
            {
              name: 'Tipo de mensaje',
              value: data.welcomer.type == 'embed' ? 'Embed' : 'Texto'
            },
            {
              name: 'Mensaje',
              value: Utilities.replacePlaceholders(
                data.welcomer.template,
                command.member
              )
            },
            {
              name: 'Imagen',
              value: data.welcomer.image
                ? data.welcomer.backgroundURL || 'no'
                : 'No'
            }
          ],
          color: data.welcomer.color,
          image: {
            url: data.welcomer.backgroundURL
          }
        }
      ]
    });
  }
}
