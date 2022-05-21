import type { BotEvents, EventData } from 'types/Event';

export default class implements EventData {
  public readonly name: keyof BotEvents = 'ready';
  public readonly once = true;

  public callback() {
    console.log('Hello world!');
  }
}
