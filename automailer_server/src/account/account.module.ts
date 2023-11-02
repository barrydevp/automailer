import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GoogleModule } from '@/google/google.module';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountCron } from './account.cron';

@Module({
  imports: [DatabaseModule, forwardRef(() => GoogleModule)],
  controllers: [AccountController],
  providers: [AccountService, AccountCron],
  exports: [AccountService],
})
export class AccountModule {}
