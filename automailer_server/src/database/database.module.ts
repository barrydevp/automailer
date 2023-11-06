import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountRepository,
  AccountStatsRepository,
} from '@/database/repositories';
import {
  Account,
  AccountSchema,
  AccountStats,
  AccountStatsSchema,
} from './schemas';

const mongooseModule = MongooseModule.forRootAsync({
  inject: [ConfigService],
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
});

@Module({
  imports: [
    mongooseModule,
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: AccountStats.name, schema: AccountStatsSchema },
    ]),
  ],
  providers: [AccountRepository, AccountStatsRepository],
  exports: [MongooseModule, AccountRepository, AccountStatsRepository],
})
export class DatabaseModule {}
