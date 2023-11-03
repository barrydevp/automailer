import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GoogleAuthService } from '@/google/auth/google-auth.service';
import { GmailService } from '@/google/api/gmail.service';
import { AccountRepository } from '@/database/repositories';
import { Account } from '@/database/schemas';
import {
  CreateAccountDto,
  UpdateAccountDto,
  FindAccountRequestDto,
} from './dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly goauthService: GoogleAuthService,
    private readonly gmailService: GmailService,
  ) {}

  async create(data: CreateAccountDto) {
    const account = await this.accountRepository.upsert(
      {
        type: data.type,
        email: data.email,
      },
      data,
    );

    return account;
  }

  async find(query: FindAccountRequestDto) {
    const data = await this.accountRepository.find(
      query.getFilter(),
      {},
      {
        sort: { _id: -1 },
        skip: query.page * query.limit,
        limit: query.limit,
      },
    );

    return {
      page: query.page,
      limit: query.limit,
      data,
    };
  }

  async findOne(id: string) {
    const account = await this.accountRepository.findOne({ _id: id });
    if (!account) {
      throw new NotFoundException(`Account not found for id ${id}.`);
    }

    return account;
  }

  async moveGmailSpamToInbox(account: Account, maxMessage?: number) {
    if (!account.credentials) {
      return false;
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
    }

    // TODO: do something here
  }

  // update(id: number, updateAccountDto: UpdateAccountDto) {
  //   return `This action updates a #${id} account`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} account`;
  // }
}
