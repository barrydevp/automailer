import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { toDateDay } from '@/shared/utils';

export type AccountStatsDocument = HydratedDocument<AccountStats>;

export enum eAccountStatsEventType {
  GENERIC = 'generic',
  ERROR = 'error',
}

@Schema({})
export class AccountStatsEvent {
  @Prop({ enum: eAccountStatsEventType, required: true })
  type: eAccountStatsEventType;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  body: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  created: Date;
}

@Schema({ timestamps: true })
export class AccountStats {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    index: true,
    required: true,
  })
  account; // if populate is not call then objectId otw Account

  @Prop({ default: 0 })
  mailMoved: number;

  @Prop({ default: 0 })
  mailReplied: number;

  @Prop({ default: 0 })
  runTimes: number;

  @Prop({ default: () => toDateDay(new Date()) })
  day: string;

  @Prop({ default: [] })
  events: AccountStatsEvent[];

  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const AccountStatsSchema = SchemaFactory.createForClass(AccountStats);

AccountStatsSchema.index({ account: 1, day: 1 });
