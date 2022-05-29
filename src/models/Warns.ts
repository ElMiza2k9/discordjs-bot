import { model, Schema } from 'mongoose';

export const Warns = model<WarnsInterface>(
  'Warns',
  new Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    warns: [
      {
        reason: { type: String, required: true },
        moderator: { type: String, required: true },
        date: { type: Date, required: true }
      }
    ]
  })
);

interface WarnsInterface {
  userId: string;
  guildId: string;
  warns: Warn[];
}

interface Warn {
  reason: string;
  moderator: string;
  date: Date;
}
