import type { ApplicationCommandOptionData } from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import { ServerModel } from 'models/Server';
import { color } from 'config';

export default class implements CommandData {
  public readonly name: string = 'jtc';
  public readonly description: string =
    'Configura los canales de voz temporales';
  public readonly options?: ApplicationCommandOptionData[] = [
    {
      name: 'toggle',
      description: 'Activa/desactiva los canales de voz temporales',
      type: 'BOOLEAN'
    },
    {
      name: 'channel',
      description: 'El canal que se usará para crear canales de voz',
      type: 'CHANNEL',
      channelTypes: ['GUILD_VOICE']
    },
    {
      name: 'parent',
      description: 'La categoría donde crearé los canales temporales',
      type: 'CHANNEL',
      channelTypes: ['GUILD_CATEGORY']
    },
    {
      name: 'text-channels',
      description: '¿Crear canales de texto?',
      type: 'BOOLEAN'
    },
    {
      name: 'template-voice',
      description: 'El template para el nombre del canal de voz',
      type: 'STRING'
    },
    {
      name: 'template-text',
      description: 'El template para el nombre del canal de texto',
      type: 'STRING'
    }
  ];

  public async callback({ command, ephemeral, args }: CommandParams) {
    if (!command.memberPermissions.has('ADMINISTRATOR'))
      return command.reply({
        content: 'No tienes permisos para usar este comando.',
        ephemeral
      });

    if (!command.guild.me?.permissions.has('MANAGE_CHANNELS'))
      return command.reply({
        content: 'No tengo permisos para gestionar canales.',
        ephemeral
      });

    const server =
      (await ServerModel.findOne({ _id: command.guild.id })) ||
      new ServerModel({ _id: command.guild.id });

    const toggle = args.getBoolean('toggle');
    const channel = args.getChannel('channel');
    const parent = args.getChannel('parent');
    const textChannels = args.getBoolean('text-channels');
    const templateVoice = args.getString('template-voice');
    const templateText = args.getString('template-text');

    if (typeof toggle == 'boolean') {
      server.jtc.enabled = toggle;
    }

    if (channel && channel.isVoice()) {
      server.jtc.channel = channel.id;
      server.jtc.parent ??= channel.parent?.id;
    }

    if (parent) {
      server.jtc.parent = parent.id;
    }

    if (
      server.jtc.channel &&
      !command.guild.channels.cache.get(server.jtc.channel)
    )
      server.jtc.channel = null;

    if (
      server.jtc.parent &&
      !command.guild.channels.cache.get(server.jtc.parent)
    )
      server.jtc.parent = null;

    if (templateText) {
      if (templateText.length > 20)
        return command.reply({
          content: 'El template del canal de texto es demasiado largo (>20).',
          ephemeral
        });
      server.jtc.textTemplate = templateText;
    }

    if (templateVoice) {
      if (templateVoice.length > 20)
        return command.reply({
          content: 'El template del canal de voz es demasiado largo (>20).',
          ephemeral
        });
      server.jtc.template = templateVoice;
    }

    if (textChannels && typeof textChannels == 'boolean')
      server.jtc.textChannel = textChannels;

    await server.save();

    return void command.reply({
      embeds: [
        {
          author: {
            name: `Configuración de canales de voz temporales`,
            icon_url: command.guild.iconURL({ dynamic: true }) || undefined
          },
          fields: [
            {
              name: 'Sistema activo',
              value: server.jtc.enabled ? 'Si' : 'No'
            },
            {
              name: 'Canal de voz',
              value: server.jtc.channel
                ? `<#${server.jtc.channel}>`
                : 'No configurado'
            },
            {
              name: 'Categoría',
              value: server.jtc.parent
                ? `<#${server.jtc.parent}>`
                : 'No configurado'
            },
            {
              name: 'Crear canal de texto',
              value: server.jtc.textChannel ? 'Sí' : 'No'
            },
            {
              name: 'Template de nombre de canal de voz',
              value: server.jtc.template || 'No configurado'
            },
            {
              name: 'Template de nombre de canal de texto',
              value: server.jtc.textTemplate || 'No configurado'
            }
          ],
          timestamp: new Date(),
          color
        }
      ]
    });
  }
}
