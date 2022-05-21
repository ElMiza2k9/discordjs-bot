import type { CommandData, CommandParams } from 'types/Command';

export default class implements CommandData {
  public readonly name: string = 'ping';
  public readonly description: string = 'Calcula la latencia del bot';

  public async callback({ client, command, ephemeral }: CommandParams) {
    await command.reply({
      content: `¡Pong! La latencia es de ${client.ws.ping}ms`,
      ephemeral
    });
  }
}
