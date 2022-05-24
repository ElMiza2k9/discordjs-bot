import type { GuildMember } from 'discord.js';

export class Utilities {
  static checkHexColor(color: string) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  static replacePlaceholders(template: string, member: GuildMember) {
    return template
      .replaceAll(/{username}/g, member.user.username)
      .replaceAll(/{mention}/g, member.toString())
      .replaceAll(/{tag}/g, member.user.tag)
      .replaceAll(/{id}/g, member.user.id)
      .replaceAll(/{guildName}/g, member.guild.name)
      .replaceAll(/{guildCount}/g, member.guild.memberCount.toString());
  }
}
