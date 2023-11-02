import { Exclude } from 'class-transformer';
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

export enum eAccountType {
  NONE = 'none',
  GOOGLE = 'google',
}

@Schema({ timestamps: true })
export class Account {
  @Prop({})
  externalId?: string;

  @Prop({ default: eAccountType.NONE, enum: eAccountType, index: true })
  type: string;

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
  @Prop(
    raw({
      accessToken: String,
      refreshToken: String,
      scope: String,
      tokenType: String,
      idToken: String,
      expriryDate: Date,
    }),
  )
  credentials?: Record<string, string>;

  @Prop()
  createdAt: Date;
  @Prop()
  updatedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
