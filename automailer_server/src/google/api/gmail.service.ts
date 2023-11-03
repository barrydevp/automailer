import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

const MAX_MESSAGE_PER_FETCH = 100;

@Injectable()
export class GmailService {
  constructor(private config: ConfigService) {}

  getV1(auth: OAuth2Client) {
    return google.gmail({ version: 'v1', auth });
  }

  async *spamBoxIterator(gmail: gmail_v1.Gmail, max: number = 10000) {
    let pageToken: string;
    let n = 0;

    while (n < max) {
      const maxResults =
        max - n > MAX_MESSAGE_PER_FETCH ? MAX_MESSAGE_PER_FETCH : max - n;

      const listResponse = await gmail.users.messages
        .list({
          userId: 'me',
          pageToken,
          labelIds: ['SPAM'],
          maxResults,
        })
        .then((r) => r.data);

      const messages = listResponse.messages || [];
      pageToken = listResponse.nextPageToken;
      n += messages.length;
      yield messages;

      if (!pageToken) {
        return;
      }
    }
  }

  async batchSpamToInbox(
    gmail: gmail_v1.Gmail,
    messages: gmail_v1.Schema$Message[],
  ) {
    if (!messages.length) {
      return;
    }
    return gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messages.map((m) => m.id),
        removeLabelIds: ['SPAM'],
        addLabelIds: ['INBOX', 'IMPORTANT', 'STARRED'],
      },
    });
  }
}
