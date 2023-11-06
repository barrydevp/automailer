import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { AccountStats } from '@/database/schemas';

@Injectable()
export class AccountStatsRepository extends BaseRepository<
  AccountStats,
  AccountStats
> {
  constructor(@InjectModel(AccountStats.name) model: Model<AccountStats>) {
    super(model, AccountStats);
  }
}
