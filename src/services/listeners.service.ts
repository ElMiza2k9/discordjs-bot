import type { BotClient } from 'base/Client';
import { sync as glob } from 'glob';
import { join } from 'path';

export class EventService {
  public constructor(private client: BotClient) {}

  public callbacks: Map<
    string,
    { event: string; cb: (...args: any[]) => any }
  > = new Map();

  public async init() {
    const files = glob(`./src/listeners/**/*{.ts,.js}`);

    for (const file of files) {
      const Event = require(join(process.cwd(), file)).default;
      const event = new Event(this.client);
      const cb = (...args: any[]) => event.callback(...args);

      this.client.on(event.name, cb);

      const fileName = file.split('/').pop()!.split('.')[0];
      if (fileName) this.callbacks.set(fileName, { event: event.name, cb });
    }

    return void 0;
  }

  public reloadEvent(fileName: string) {
    const event = this.callbacks.get(fileName);
    if (event) {
      this.client.removeListener(event.event, event.cb);
      return true;
    } else return false;
  }
}
