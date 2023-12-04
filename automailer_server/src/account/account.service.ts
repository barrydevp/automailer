import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as _ from 'lodash';
import * as P from 'bluebird';
import { errToJSON, toDateDay } from '@/shared/utils';
import { GoogleAuthService } from '@/google/auth/google-auth.service';
import { GmailService } from '@/google/api/gmail.service';
import {
  AccountRepository,
  AccountStatsRepository,
} from '@/database/repositories';
import {
  Account,
  AccountStats,
  eAccountStatsEventType,
  eAccountStatus,
  eAccountType,
} from '@/database/schemas';
import {
  CreateAccountDto,
  UpdateAccountDto,
  FindAccountRequestDto,
  BulkWriteAccountDto,
  AccountIdDto,
} from './dto';

const invalidCredErr = new Error('Invalid account credentials.');

export function isInvalidCredentialErr(err) {
  return (
    err === invalidCredErr ||
    err?.message === 'access_denied' ||
    err?.message === 'invalid_grant' ||
    err?.message === 'Invalid Credentials'
  );
}

function parseRunErr(err): Record<string, any> {
  return errToJSON(err);
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

  async findAll(query: FindAccountRequestDto) {
    const data = await this.accountRepo.findAll(query.getFilter(), '-__v', {
      sort: { _id: -1 },
    });

    return {
      data,
    };
  }

  async findById(id: string) {
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

  async updateAfterRun(account: Account, err?: any) {
    const updateStats: Partial<AccountStats> = {
      runTimes: 1,
    };
    const updateAccount: Partial<Account> = {
      updatedAt: new Date(),
    };

    if (err) {
      if (isInvalidCredentialErr(err)) {
        updateAccount.status = eAccountStatus.CRED_INVALID;
      }
      updateStats.events = [
        {
          type: eAccountStatsEventType.ERROR,
          description: 'An error occurred when running moveGmailSpamToInbox().',
          body: parseRunErr(err),
          created: new Date(),
        },
      ];
    }

    await this.updateStats(account, updateStats).catch((e) =>
      this.logger.error(e, 'Update account stats failed'),
    );

    this.accountRepo.Model.findOneAndUpdate(
      { _id: account._id },
      { $set: updateAccount },
      { projection: '_id' },
    ).catch((e) => this.logger.error(e, 'Update account status failed'));

    return true;
  }

  async updateStats(account: Account, params: Partial<AccountStats>) {
    const now = new Date();

    const $set: any = {
      account: account._id,
      day: toDateDay(now),
    };

    const $push: any = {};
    if (params.events) {
      $push.events = { $each: params.events };
    }

    const $inc: any = {};
    if (params.runTimes) {
      $inc.runTimes = params.runTimes;
    }
    if (params.mailMoved) {
      $inc.mailMoved = params.mailMoved;
    }
    if (params.mailReplied) {
      $inc.mailReplied = params.mailReplied;
    }

    const newStats = await this.accountStatsRepo.Model.findOneAndUpdate(
      {
        account: account._id,
        day: toDateDay(now),
      },
      {
        $set,
        $inc,
        $push,
      },
      { projection: '_id', upsert: true, new: true },
    );

    if (account?.stats?.day !== newStats) {
      await this.accountRepo.Model.findOneAndUpdate(
        {
          _id: account._id,
        },
        { $set: { stats: newStats._id } },
        { projection: '_id' },
      );
    }

    return true;
  }

  _getGCredentials(account: Account) {
    const { credentials } = account;
    return {
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      scope: credentials.scope,
      token_type: credentials.tokenType,
      id_token: credentials.idToken,
    };
  }

  _getGOauth2(account: Account) {
    const oauth = this.goauthService.getOauth2Client(
      this._getGCredentials(account),
    );

    return oauth;
  }

  async listGmailBox(id: any, messageIds: string[], maxMessage: number = 10) {
    const account = await this.findById(id);

    const oauth = this._getGOauth2(account);
    const gmail = this.gmailService.getV1(oauth);

    const mails = [];

    if (messageIds && messageIds.length) {
      mails.push(
        ...(await this.gmailService.listMessageMetadata(gmail, messageIds)),
      );
    } else {
      const boxIter = this.gmailService.messageIterator(gmail, {}, maxMessage);
      for await (const messages of boxIter) {
        mails.push(...messages);
      }
    }

    return mails;
  }

  async replyGmail(id: any, messages: { id: string }[]) {
    const account = await this.findById(id);

    const oauth = this._getGOauth2(account);
    const gmail = this.gmailService.getV1(oauth);

    const batchRet = await this.gmailService.batchReplyGmail(gmail, messages, {
      text: 'Thank you for your information.',
    });

    const errReplieds = batchRet.filter((e) => !!e.err);
    const nReplied = batchRet.length - errReplieds.length;

    const updateStatsParams: Record<string, any> = {
      mailReplied: nReplied,
    };

    await this.updateStats(account, updateStatsParams);

    return batchRet;
  }

  async moveGmailAndReply(account: Account, maxMessage?: number) {
    if (!account.credentials) {
      throw invalidCredErr;
    }

    const result = {
      moved: 0,
      replied: 0,
      duration: 0,
    };

    const start = performance.now();

    const oauth = this._getGOauth2(account);
    const gmail = this.gmailService.getV1(oauth);

    const spamBoxIter = this.gmailService.messageIterator(
      gmail,
      {
        labelIds: ['UNREAD'],
        // labelIds: ['CATEGORY_PROMOTIONS'],
        // labelIds: ['SPAM'],
        includeSpamTrash: true,
      },
      maxMessage,
    );

    for await (const messages of spamBoxIter) {
      this.logger.log(
        `account(${account._id}) number of messages ${messages.length}`,
      );

      await this.gmailService.batchModifyMessages(gmail, messages, {
        requestBody: {
          removeLabelIds: ['SPAM', 'CATEGORY_PROMOTIONS', 'UNREAD'],
          // removeLabelIds: ['SPAM'],
          addLabelIds: ['INBOX', 'IMPORTANT', 'STARRED'],
          // addLabelIds: ['INBOX', 'STARRED'],
        },
      });

      this.logger.log(`account(${account._id}) moved ${messages.length}`);
      // TODO: add statistic here

      result.moved += messages.length;

      const batchRet = await this.gmailService.batchReplyGmail(
        gmail,
        messages,
        {
          text: 'Thank you for your information.',
        },
      );

      const errReplieds = batchRet.filter((e) => !!e.err);

      const nReplied = batchRet.length - errReplieds.length;
      this.logger.log(`account(${account._id}) replied ${nReplied}`);

      result.replied += nReplied;

      const updateStatsParams: Record<string, any> = {
        mailReplied: nReplied,
        mailMoved: messages.length,
      };

      if (errReplieds.length) {
        updateStatsParams.events = [
          {
            type: eAccountStatsEventType.ERROR,
            description: 'An error occurred when reply gmail.',
            body: errReplieds,
            created: new Date(),
          },
        ];
      }

      await this.updateStats(account, updateStatsParams);
    }

    result.duration = performance.now() - start;

    // TODO: do something here
    return result;
  }

  async manualMoveGmailAndReply(listIds: string[]) {
    const accounts = await this.accountRepo.find(
      {
        _id: listIds,
        type: eAccountType.GOOGLE,
      },
      { _id: 1, email: 1, credentials: 1, status: 1, stats: 1 },
      { limit: 1000, sort: { updatedAt: 1 } },
    );

    return P.map(
      accounts,
      async (account) => {
        const report: Record<string, any> = {
          _id: account._id,
        };

        try {
          const result = await this.moveGmailAndReply(account, 100);
          Object.assign(report, result);
        } catch (e) {
          this.logger.error(e, 'error when run manualMoveGmailAndReply()');
          report.err = e.message;
        }

        return report;
      },
      { concurrency: 1 },
    );
  }

  async bulkWrite(ops: BulkWriteAccountDto) {
    const bulkOps = [];
    if (ops?.update?.length) {
      bulkOps.push(
        ...ops.update.map((op) => {
          return {
            updateOne: {
              filter: {
                _id: op._id,
              },
              update: {
                $set: _.omit(op, '_id'),
              },
            },
          };
        }),
      );
    }

    if (ops?.delete?.length) {
      bulkOps.push(
        ...ops.delete.map((op) => {
          return {
            updateOne: {
              filter: {
                _id: op._id,
              },
              update: {
                $set: {
                  status: eAccountStatus.INACTIVE,
                  deactiveAt: new Date(),
                },
              },
            },
          };
        }),
      );
    }

    if (!bulkOps.length) {
      throw new BadRequestException('No write operations.');
    }

    return this.accountRepo.bulkWrite(bulkOps);
  }

  async bulkDeactivate(ids: any[]) {
    // return this.accountRepo.bulkWrite(
    //   ids.map((id) => {
    //     return {
    //       updateOne: {
    //         filter: { _id: id },
    //         update: {
    //           $set: {
    //             status: eAccountStatus.INACTIVE,
    //             deactiveAt: new Date(),
    //           },
    //         },
    //       },
    //     };
    //   }),
    // );
    return P.map(
      ids,
      (id) => {
        return this.deactiveById(id);
      },
      { concurrency: 3 },
    );
  }

  async updateById(id: any, update: UpdateAccountDto) {
    const updatedAccount = await this.accountRepo.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: update,
      },
    );

    return this.accountRepo.mapEntity(updatedAccount);
  }

  async deactiveById(id: any) {
    const account = await this.findById(id);

    await this.goauthService.oauth2Revoke(this._getGCredentials(account));

    const deAccount = await this.accountRepo.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          status: eAccountStatus.INACTIVE,
          deactiveAt: new Date(),
        },
      },
    );

    return this.accountRepo.mapEntity(deAccount);
  }
}
