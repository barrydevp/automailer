import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountService } from './account.service';
import { GmailService } from '@/google/api/gmail.service';
import { GoogleAuthService } from '@/google/auth/google-auth.service';
import { AccountRepository } from '@/database/repositories';

@Injectable()
export class AccountCron {
  private readonly logger = new Logger(AccountCron.name);
  private moveGmailSpamToInboxRunning: boolean = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly accountRepository: AccountRepository,
    private readonly goauthService: GoogleAuthService,
    private readonly gmailService: GmailService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async moveGmailSpamToInbox() {
    if (this.moveGmailSpamToInboxRunning) {
      return;
    }

    this.moveGmailSpamToInboxRunning = true;

    try {
      const accounts = await this.accountRepository.find({}, {}, { limit: 2 });
      this.logger.log(`Number of accounts: ${accounts.length}`);

      for (const account of accounts) {
        await this.accountService.moveGmailSpamToInbox(account, 100);
      }

      this.logger.log(`Done ${accounts.length} accounts.`);
    } catch (err) {
      this.logger.error(err);
    } finally {
      // this.moveGmailSpamToInboxRunning = false;
    }
  }
}
