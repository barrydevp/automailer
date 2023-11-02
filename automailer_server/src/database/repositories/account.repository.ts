import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Account } from '@/database/schemas';

@Injectable()
export class AccountRepository extends BaseRepository<Account, Account> {
  constructor(@InjectModel(Account.name) model: Model<Account>) {
    super(model, Account);
  }
}
