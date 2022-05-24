import {
  type ApplicationCommandOptionData,
  Formatters,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  type Role
} from 'discord.js';
import type { CommandData, CommandParams } from 'types/Command';
import { color, userFlags } from 'config';

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
      user: await (args.getUser('target') || command.user).fetch(true),
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
        const flags = target.user.flags?.toArray().length
          ? target.user.flags
              ?.toArray()
              .map(str => userFlags[str])
              .join(' ')
          : 'No tiene';

        const roles: Role[] = target.member
          ? target.member.roles.cache
              .sort((a, b) => b.position - a.position)
              .map(x => x)
              .filter(x => x.id != command.guild.id)
              .slice(0, 15)
          : [];

        const stringRoles =
          target.member && roles.length
            ? roles.map(x => x.toString()).join(',') +
              (target.member.roles.cache.size > 15
                ? `, y ${target.member.roles.cache.size - roles.length} más...`
                : '')
            : 'No tiene';

        let descriptionArray = [
          `**ID:** ${target.user.id}`,
          `**Avatar:** [ver original](${target.user.displayAvatarURL({
            dynamic: true,
            format: target.user.avatar?.startsWith('a_') ? 'gif' : 'png',
            size: 4096
          })})`,
          `**Fecha de unión:** ${Formatters.time(
            ~~(+target.user.createdAt / 1000),
            'R'
          )}`,
          `**Insignias**: ${flags}`
        ];

        if (target.member) {
          descriptionArray.push(
            '',
            `**Apodo:** ${target.member.nickname || 'No tiene'}`,
            `**Fecha de unión:** ${Formatters.time(
              ~~(+target.member.joinedAt! / 1000),
              'R'
            )}`,
            `**Mejora el servidor:** ${
              target.member.premiumSince
                ? Formatters.time(~~(+target.member.premiumSince / 1000))
                : 'No'
            }`,
            `**Roles:** ${stringRoles}`
          );
        }

        const description = descriptionArray.join('\n');

        const embeds = [
          new MessageEmbed({
            color: target.user.accentColor || color,
            author: {
              name: `Información de ${target.user.tag}`,
              icon_url: target.user.displayAvatarURL({ dynamic: true })
            },
            description,
            thumbnail: {
              url: target.member
                ? target.member.displayAvatarURL({ dynamic: true })
                : target.user.displayAvatarURL({ dynamic: true })
            },
            image: {
              url:
                target.user.bannerURL({ dynamic: true, size: 4096 }) ||
                undefined
            }
          })
        ];

        return void (await command.reply({
          embeds
        }));
      }
    };

    await functions[subcmd]();
  }
}
