import {
  ApplicationCommandOptionData,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import { color } from 'config';

export default class implements CommandData {
  public readonly name: string = 'user';
  public readonly description: string = 'Obtén información de un usuario.';
  public readonly options: ApplicationCommandOptionData[] = [
    {
      name: 'avatar',
      description: 'Muestra el avatar del usuario.',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'target',
          description: 'El usuario del que se obtendrá el avatar.',
          type: 'USER'
        }
      ]
    },
    {
      name: 'info',
      description: 'Muestra información del usuario.',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'target',
          description: 'El usuario del que se obtendrá el avatar.',
          type: 'USER'
        }
      ]
    }
  ];

  public async callback({
    command,
    args,
    ephemeral
  }: CommandParams): Promise<void> {
    type subcommands = 'avatar' | 'info';
    const subcmd = args.getSubcommand() as subcommands;
    const target = {
      user: args.getUser('target') || command.user,
      get member() {
        return this.user.id == command.user.id
          ? command.member
          : args.getMember('target');
      }
    };

    const functions = {
      async avatar() {
        const buttons = [
          new MessageButton({
            custom_id: 'avatar-global',
            label: 'Global',
            type: 2,
            style: 2
          }),
          new MessageButton({
            custom_id: 'avatar-guild',
            label: 'Servidor',
            type: 2,
            style: 2
          })
        ];

        const components = [new MessageActionRow({ components: buttons })];

        const embeds = {
          global: new MessageEmbed({
            image: {
              url: target.user.displayAvatarURL({
                dynamic: true,
                size: 4096
              })
            },
            color,
            author: { name: `Avatar de ${target.user.tag}` },
            description: `[ver original](${target.user.displayAvatarURL({
              dynamic: true,
              format: target.user.avatar?.startsWith('a_') ? 'gif' : 'png',
              size: 4096
            })})`
          }),
          guild: target.member?.avatar
            ? new MessageEmbed({
                color,
                image: {
                  url: target.member.displayAvatarURL({
                    dynamic: true,
                    size: 4096
                  })
                },
                author: {
                  name: `Avatar de ${target.user.tag} en ${command.guild.name}`
                },
                description: `[ver original](${target.member.displayAvatarURL({
                  dynamic: true,
                  format: target.member.avatar?.startsWith('a_')
                    ? 'gif'
                    : 'png',
                  size: 4096
                })})`
              })
            : null
        };

        const msg = await command
          .reply({
            fetchReply: true,
            embeds: [embeds.global],
            components: embeds.guild ? components : undefined
          })
          .catch(() => null);

        if (!msg || !embeds.guild) return;

        const collector = msg.createMessageComponentCollector({
          idle: 30000,
          filter(btn) {
            if (btn.user.id == command.user.id) return true;
            else {
              btn.reply({
                content: 'No puedes interactuar con este botón',
                ephemeral
              });
              return false;
            }
          }
        });

        collector.on('collect', b => {
          const target = b.customId.split('-').pop() as 'global' | 'guild';
          const embed = embeds[target];

          if (embed) b.update({ embeds: [embed] });
        });

        collector.on('end', () => {
          msg.edit({
            components: [
              new MessageActionRow({
                components: buttons.map(x => x.setDisabled())
              })
            ]
          });
        });
      },
      async info() {
        console.log('Method not implemented yet');
      }
    };

    await functions[subcmd]();
  }
}
