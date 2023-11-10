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
    select: ProjectionType<Account> = '-__v',
    options: { limit?: number; sort?: any; skip?: number } = {},
  ): Promise<Account[]> {
    const data = await this.Model.find(query, select)
      .populate({
        path: 'stats',
        select: {
          _id: 0,
          mailMoved: 1,
          mailReplied: 1,
          runTimes: 1,
          'events.type': 1,
          'events.description': 1,
          day: 1,
        },
      })
      // .populate({
      //   path: 'allStats',
      //   select: {
      //     _id: 0,
      //     account: 1,
      //     mailMoved: 1,
      //     mailReplied: 1,
      //     runTimes: 1,
      //     day: 1,
      //   },
      // })
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
