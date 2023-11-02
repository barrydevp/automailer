import { Module, forwardRef } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleAuthService } from './auth/google-auth.service';
import { GmailService } from './api/gmail.service';
import { GuserService } from './api/google-user.service';
import { DatabaseModule } from 'src/database/database.module';
import { AccountModule } from 'src/account/account.module';
import { GoogleService } from './google.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => AccountModule)],
  controllers: [GoogleController],
  providers: [GoogleService, GoogleAuthService, GmailService, GuserService],
  exports: [GoogleService, GoogleAuthService, GmailService, GuserService],
})
export class GoogleModule {}
