import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

export type AccountDocument = HydratedDocument<Account>;

export enum eAccountType {
  NONE = 'none',
  GOOGLE = 'google',
}

export enum eAccountStatus {
  MANUAL = 'manual',
  AUTO = 'auto',
  CRED_INVALID = 'cred_invalid',
}

@Schema()
export class AccountCredential {
  @Prop()
  accessToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  scope: string;

  @Prop()
  tokenType: string;

  @Prop()
  idToken: string;

  @Prop()
  expriryDate: Date;
}

@Schema({ timestamps: true })
export class Account {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop()
  externalId?: string;

  @Prop({ default: eAccountType.NONE, enum: eAccountType, index: true })
  type: eAccountType;

  @Prop({ required: true, index: true })
  email: string;

  @Prop()
  verifiedEmail?: boolean;

  @Prop()
  name?: string;

  @Prop()
  givenName?: string;

  @Prop()
  familyName?: string;

  @Prop()
  picture?: string;

  @Prop()
  locale?: string;

  @Exclude({ toPlainOnly: true })
  @Prop({ required: true })
  credentials: AccountCredential;

  @Prop({ enum: eAccountStatus, index: true })
  status: eAccountStatus;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountStats',
  })
  stats?; // if populate is not call then objectId otw AccountStats

  @Prop()
  connectAt: Date;

  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ type: 1, email: 1 });
AccountSchema.index({ type: 1, status: 1 });
