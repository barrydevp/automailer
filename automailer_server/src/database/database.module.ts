import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { AccountRepository } from '@/database/repositories';

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
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  ],
  providers: [AccountRepository],
  exports: [MongooseModule, AccountRepository],
})
export class DatabaseModule {}
