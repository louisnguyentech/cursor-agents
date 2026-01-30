import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

export enum AccountRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: AccountRole, default: AccountRole.USER })
  role: AccountRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  refreshTokenExpiresAt?: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ email: 1 });
AccountSchema.index({ role: 1 });
AccountSchema.index({ deletedAt: 1 });
