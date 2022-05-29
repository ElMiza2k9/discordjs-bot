import axios from 'axios';

export class Twitch {
  public constructor(public clientId: string, public clientSecret: string) {}

  public authKey: string = '';

  public async getKey() {
    const data = await axios
      .post(
        `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`
      )
      .catch(() => null);

    if (!data) return console.log('Failed to get Twitch auth key');

    this.authKey = data.data.access_token;
    return void 0;
  }

  public async getChannel(channelName: string) {
    const data = await axios
      .get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
        headers: {
          'Authorization': `Bearer ${this.authKey}`,
          'Client-Id': this.clientId
        }
      })
      .catch(() => null);

    if (!data) return console.log('Failed to get Twitch streamer');

    return data.data.data[0];
  }

  public async getStream(channelName: string) {
    const data = await axios
      .get(`https://api.twitch.tv/helix/streams?user_login=${channelName}`, {
        headers: {
          'Authorization': `Bearer ${this.authKey}`,
          'Client-Id': this.clientId
        }
      })
      .catch(() => null);

    if (!data) return console.log('Failed to get Twitch streamer');

    return {
      ...data.data.data[0],
      thumbnail_url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channelName}-1920x1080.jpg`,
      game_art: `https://static-cdn.jtvnw.net/ttv-boxart/${data.data.data[0].game_id}-285x380.jpg`
    };
  }

  public static replacePlaceholders(
    base: string,
    stream: { channel?: string; title?: string; game?: string; url?: string }
  ) {
    return base
      .replaceAll('[channel]', stream.channel || 'unknown')
      .replaceAll('[title]', stream.title || 'unknown')
      .replaceAll('[game]', stream.game || 'unknown')
      .replaceAll('[url]', stream.url ? `<${stream.url}>` : 'unknown');
  }
}
