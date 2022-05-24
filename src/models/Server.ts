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
}
