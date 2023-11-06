import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountService, isInvalidCredentialErr } from './account.service';
import { GmailService } from '@/google/api/gmail.service';
import { GoogleAuthService } from '@/google/auth/google-auth.service';
import { AccountRepository } from '@/database/repositories';
import {
  eAccountStatsEventType,
  eAccountStatus,
  eAccountType,
} from '@/database/schemas';

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

  @Cron(CronExpression.EVERY_MINUTE)
  async moveGmailSpamToInbox() {
    if (
      this.moveGmailSpamToInboxRunning ||
      process.env.NODE_ENV == 'development' // don't run on development
    ) {
      return;
    }

    this.moveGmailSpamToInboxRunning = true;

    try {
      const accounts = await this.accountRepository.find(
        {
          type: eAccountType.GOOGLE,
          status: eAccountStatus.AUTO,
        },
        { _id: 1, email: 1, credentials: 1, status: 1, stats: 1 },
        { limit: 1000, sort: { updatedAt: 1 } },
      );

      this.logger.log(`Number of accounts: ${accounts.length}`);

      for (const account of accounts) {
        const e = await this.accountService
          .moveGmailSpamToInbox(account, 100)
          .catch((err) => {
            this.logger.error(
              err,
              `error when processing account ${account.email}`,
            );
            return err;
          });

        await this.accountService.updateAfterRun(account, e);
      }

      this.logger.log(`Done ${accounts.length} accounts.`);
    } catch (err) {
      this.logger.error(err);
    } finally {
      this.moveGmailSpamToInboxRunning = false;
    }
  }
}
