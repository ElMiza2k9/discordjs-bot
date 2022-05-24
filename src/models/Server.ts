import { model, Schema } from 'mongoose';

export const ServerModel = model<ServerInterface>(
  'Server',
  new Schema({
    _id: { type: String, required: true },
    jtc: {
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
    }
  })
);

interface ServerInterface {
  _id: string;
  jtc: {
    channel?: string | null;
    parent?: string | null;
    textChannel?: boolean;
    template: string;
    textTemplate: string;
  };
}
