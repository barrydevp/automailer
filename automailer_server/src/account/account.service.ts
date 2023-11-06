import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { GoogleAuthService } from '@/google/auth/google-auth.service';
import { GmailService } from '@/google/api/gmail.service';
import {
  AccountRepository,
  AccountStatsRepository,
} from '@/database/repositories';
import { Account, AccountStatsEvent, eAccountStatus } from '@/database/schemas';
import {
  CreateAccountDto,
  UpdateAccountDto,
  FindAccountRequestDto,
} from './dto';
import { toDateDay } from '@/shared/utils';

const invalidCredErr = new Error('Invalid account credentials.');

export function isInvalidCredentialErr(err) {
  return err === invalidCredErr || err?.message === 'invalid_grant';
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly accountStatsRepo: AccountStatsRepository,
    private readonly goauthService: GoogleAuthService,
    private readonly gmailService: GmailService,
  ) {}

  async create(data: CreateAccountDto) {
    const AccountModel = this.accountRepo.Model;
    const AccountStatsModel = this.accountStatsRepo.Model;

    const now = new Date();

    const account = await AccountModel.findOneAndUpdate(
      {
        type: data.type,
        email: data.email,
      },
      {
        ...data,
        connectAt: now,
        status: eAccountStatus.AUTO,
      },
      { upsert: true, new: true },
    ).populate('stats');

    if (!(account?.stats?.day === toDateDay(now))) {
      const stats = new AccountStatsModel({
        account: account._id,
      });
      await stats.save();

      account.stats = stats._id;
      await account.save();
    }

    return this.accountRepo.mapEntity(account);
  }

  async find(query: FindAccountRequestDto) {
    const [total, data] = await Promise.all([
      this.accountRepo.count(query.getFilter()),
      await this.accountRepo.find(
        query.getFilter(),
        {},
        {
          sort: { _id: -1 },
          skip: (query.page - 1) * query.limit,
          limit: query.limit,
        },
      ),
    ]);

    return {
      page: query.page,
      limit: query.limit,
      data,
      total,
    };
  }

  async findOne(id: string) {
    const account = await this.accountRepo.findOne({ _id: id });
    if (!account) {
      throw new NotFoundException(`Account not found for id ${id}.`);
    }

    return account;
  }

  async changeStatus(id: any, status: eAccountStatus) {
    return this.accountRepo.Model.findOneAndUpdate(
      { _id: id },
      { status: status },
    );
  }

  async moveGmailSpamToInbox(account: Account, maxMessage?: number) {
    const now = new Date();

    try {
      if (!account.credentials) {
        throw invalidCredErr;
      }

      const { credentials } = account;
      const oauth = this.goauthService.getOauth2Client({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        scope: credentials.scope,
        token_type: credentials.tokenType,
        id_token: credentials.idToken,
      });
      const gmail = this.gmailService.getV1(oauth);

      const spamBoxIter = this.gmailService.messageIterator(
        gmail,
        {
          labelIds: ['CATEGORY_PROMOTIONS'],
          includeSpamTrash: true,
        },
        maxMessage,
      );
      for await (const messages of spamBoxIter) {
        this.logger.log(`number of messages ${messages.length}`);

        await this.gmailService.batchModifyMessages(gmail, messages, {
          requestBody: {
            removeLabelIds: ['SPAM', 'CATEGORY_PROMOTIONS', 'UNREAD'],
            addLabelIds: ['INBOX', 'IMPORTANT', 'STARRED'],
          },
        });

        this.logger.log(`moved ${messages.length}`);
        // TODO: add statistic here
        const newStats = await this.accountStatsRepo.Model.findOneAndUpdate(
          {
            account: account._id,
            day: toDateDay(now),
          },
          {
            account: account._id,
            day: toDateDay(now),
          },
          { upsert: true, new: true },
        );

        if (account?.stats?.day !== newStats) {
          await this.accountRepo.Model.findOneAndUpdate(
            {
              _id: account._id,
            },
            { $set: { stats: newStats._id } },
          );
        }
      }

      // TODO: do something here
    } catch (err) {
      console.log(err.type);
      if (isInvalidCredentialErr(err)) {
        this.changeStatus(account._id, eAccountStatus.CRED_INVALID).catch((e) =>
          this.logger.error(e, 'Update account status failed'),
        );
      }
    }
  }

  // update(id: number, updateAccountDto: UpdateAccountDto) {
  //   return `This action updates a #${id} account`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} account`;
  // }
}
