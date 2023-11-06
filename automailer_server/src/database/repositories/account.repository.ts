import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Account } from '@/database/schemas';

@Injectable()
export class AccountRepository extends BaseRepository<Account, Account> {
  constructor(@InjectModel(Account.name) model: Model<Account>) {
    super(model, Account);
  }

  async find(
    query: FilterQuery<Account>,
    select: ProjectionType<Account> = '',
    options: { limit?: number; sort?: any; skip?: number } = {},
  ): Promise<Account[]> {
    const data = await this.Model.find(query, select)
      .populate({
        path: 'stats',
        select: '-account',
      })
      .sort(options.sort)
      .skip(options.skip as number)
      .limit(options.limit as number)
      .lean()
      .exec();

    return this.mapEntities(data);
  }

  async findAll(
    query: FilterQuery<Account>,
    select: ProjectionType<Account> = '',
    options: { limit?: number; sort?: any; skip?: number } = {},
  ): Promise<Account[]> {
    const data = await this.Model.find(query, select)
      .populate({
        path: 'stats',
        select: '-account',
      })
      .sort(options.sort)
      .lean()
      .exec();

    return this.mapEntities(data);
  }

  async findOne(
    query: FilterQuery<Account>,
    select?: ProjectionType<Account>,
    options: {
      readPreference?: 'secondaryPreferred' | 'primary';
      query?: QueryOptions<Account>;
    } = {},
  ): Promise<Account | null> {
    const data = await this.Model.findOne(query, select, options.query)
      .populate({
        path: 'stats',
        select: '-account',
      })
      .read(options.readPreference || 'primary');
    if (!data) return null;

    return this.mapEntity(data.toObject());
  }
}
