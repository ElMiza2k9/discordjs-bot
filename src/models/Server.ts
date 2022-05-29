import { color } from 'config';
import { model, Schema } from 'mongoose';

export const ServerModel = model<ServerInterface>(
  'Server',
  new Schema({
    _id: { type: String, required: true },
    jtc: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
      parent: { type: String, default: null },
      textChannel: { type: Boolean, default: false },
      template: {
        type: String,
        default: "☕ {name}'s channel"
      },
      textTemplate: {
        type: String,
        default: '🎎 {name}'
      }
    },
    welcomer: {
      enabled: { type: Boolean, default: false },
      channel: { type: String, default: null },
      type: {
        type: String,
        default: 'embed',
        enum: ['embed', 'text']
      },
      template: {
        type: String,
        default: '¡{tag} se ha unido al servidor!'
      },
      image: { type: Boolean, default: false },
      background: { type: String, default: null },
      backgroundURL: { type: String, default: null },
      color: { type: String, default: color }
    },
    automoderator: {
      exclude: [{ type: String }],
      bannedWords: {
        enabled: { type: Boolean, default: false },
        words: [{ type: String }]
      },
      antiInvites: { type: Boolean, default: false },
      antiLinks: { type: Boolean, default: false },
      antiMentions: { type: Boolean, default: false },
      antiFlood: { type: Boolean, default: false },
      antiCaps: { type: Boolean, default: false },
      antiDuplicates: { type: Boolean, default: false },
      punishments: [{ onWarns: Number, do: String }]
    },
    twitch: {
      enabled: { type: Boolean, default: false },
      streamers: [{ type: String }],
      channel: { type: String, default: null },
      lastStreams: [{ channel: String, id: String }],
      template: {
        type: String,
        default: '¡[channel] está en vivo! Entren todos \\👍'
      }
    },
    tiktok: {
      enabled: { type: Boolean, default: false },
      users: [{ type: String }],
      channel: { type: String, default: null },
      infoUsers: [{ user: String, videoCount: Number }],
      template: {
        type: String,
        default: '¡[user] ha subido un nuevo video! 🎵 [url]'
      }
    }
  })
);

export interface ServerInterface {
  _id: string;
  jtc: {
    enabled?: boolean;
    channel?: string | null;
    parent?: string | null;
    textChannel?: boolean;
    template: string;
    textTemplate: string;
  };
  welcomer: {
    enabled?: boolean;
    channel?: string;
    type: 'embed' | 'text';
    template: string;
    image: boolean;
    background?: string;
    backgroundURL?: string;
    color: `#${string}`;
  };
  automoderator: {
    exclude: string[];
    bannedWords: {
      enabled: boolean;
      words: string[];
    };
    antiInvites: boolean;
    antiLinks: boolean;
    antiMentions: boolean;
    antiFlood: boolean;
    antiCaps: boolean;
    antiDuplicates: boolean;
    punishments: Punishment[];
  };
  twitch: {
    enabled: boolean;
    streamers: string[];
    channel?: string;
    lastStreams: Array<{ channel: string; id: string }>;
    template: string;
  };
  tiktok: {
    enabled: boolean;
    users: string[];
    channel?: string;
    infoUsers: Array<{ user: string; videoCount?: number }>;
    template: string;
  };
}

interface Punishment {
  onWarns: number;
  do: 'ban' | 'kick' | 'mute';
}
