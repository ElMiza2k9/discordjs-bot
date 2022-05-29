import type { TikTokFeedItem, TikTokUser } from 'types/TikTok';
import axios from 'axios';

export class TikTok {
  constructor() {}
  private readonly baseUrl = 'http://www.tiktok.com/@[user]?lang=es';
  private readonly baseNodeUrl = 'https://www.tiktok.com/node/';

  private readonly headers = {
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'authority': 'www.tiktok.com',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Host': 'www.tiktok.com',
    'User-Agent':
      'Mozilla/5.0  (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/86.0.170 Chrome/80.0.3987.170 Safari/537.36'
  };

  public async getUser(username: string): Promise<TikTokUser> {
    const objectUndefined = { user: undefined, stats: undefined };

    const res = await axios
      .get(this.baseUrl.replace('[user]', username), { headers: this.headers })
      .catch(() => null);

    if (!res || !res.data) return objectUndefined;

    const data: string = res.data;
    const match = data
      .split(`<script id="SIGI_STATE" type="application/json">`)[1]
      ?.split('</script>')[0];
    if (!match) return objectUndefined;

    try {
      const toJson = JSON.parse(match);

      if (!toJson?.UserModule?.users[username]) return objectUndefined;
      const user = toJson.UserModule.users[username];

      if (!toJson?.UserModule?.stats[username]) return objectUndefined;
      const stats = toJson.UserModule.stats[username];

      return {
        user,
        stats
      };
    } catch {
      return objectUndefined;
    }
  }

  public async getUserFeed(
    user: TikTokUser | string
  ): Promise<TikTokFeedItem[]> {
    if (typeof user == 'string') user = await this.getUser(user);
    if (!user || !user.user) return [];

    const res = await axios
      .get(`${this.baseNodeUrl}video/feed`, {
        params: {
          type: '1',
          secUid: user.user.secUid,
          id: user.user.id,
          count: '20',
          lang: 'es',
          minCursor: '0',
          maxCursor: '0'
        }
      })
      .catch(() => null);

    if (!res || !res.data || !res.data?.body?.itemListData?.length) return [];

    return res.data.body.itemListData;
  }

  public static replacePlaceholders(
    base: string,
    video: { user?: string; text?: string; music?: string; url?: string }
  ) {
    return base
      .replaceAll('[user]', video.user || 'unknown')
      .replaceAll('[text]', video.text || 'unknown')
      .replaceAll('[musicName]', video.music || 'unknown')
      .replaceAll('[url]', video.url ? `<${video.url}>` : 'unknown');
  }
}
