import 'dotenv/config';
import { BotClient } from 'base/Client';

(async () => {
  const client = new BotClient();
  try {
    console.log('Conectando a Discord...');
    await client.start();
    console.log(`¡Conectado como ${client.user.tag}!`);
  } catch (err) {
    console.error(err);
  }
})();
