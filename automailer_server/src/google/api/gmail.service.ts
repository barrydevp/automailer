import * as P from 'bluebird';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GenericException } from '@/shared/exceptions/generic.exception';
import { SendMailOptions } from 'nodemailer';

// eslint-disable-next-line
const MailComposer = require('nodemailer/lib/mail-composer');

const MAX_MESSAGE_PER_FETCH = 100;

type yieldFnState<T, NextT> = {
  data?: T;
  next?: NextT;
  n: number;
};

type yieldFn<T, NextT> = (
  state: yieldFnState<T, NextT>,
) => Promise<Omit<yieldFnState<T, NextT>, 'n'>>;

@Injectable()
export class GmailService {
  constructor(private config: ConfigService) {}

  getV1(auth: OAuth2Client) {
    return google.gmail({ version: 'v1', auth });
  }

  async *_createIterator<T, NextT>(
    yieldFn: yieldFn<T, NextT>,
    initState?: Partial<yieldFnState<T, NextT>>,
    max: number = 10000,
  ): AsyncIterable<T> {
    let state = { n: 0, ...initState };

    while (state.n < max) {
      const { data, next } = await yieldFn(state);
      state = {
        data,
        next,
        n: state.n + ((Array.isArray(data) && data.length) || 1),
      };

      yield data;

      if (!next) {
        return;
      }
    }
  }

  async *threadIterator(
    gmail: gmail_v1.Gmail,
    params: Omit<gmail_v1.Params$Resource$Users$Threads$List, 'maxResults'>,
    max: number = 10000,
  ) {
    let pageToken = params.pageToken;
    let n = 0;

    while (n < max) {
      const maxResults =
        max - n > MAX_MESSAGE_PER_FETCH ? MAX_MESSAGE_PER_FETCH : max - n;

      const listResponse = await gmail.users.threads
        .list({
          userId: 'me',
          ...params,
          pageToken,
          maxResults,
        })
        .then((r) => r.data);

      const threads = listResponse.threads || [];
      pageToken = listResponse.nextPageToken;
      n += threads.length;
      yield threads;

      if (!pageToken) {
        return;
      }
    }
  }

  async listMessageMetadata(gmail: gmail_v1.Gmail, ids: string[]) {
    const messages = await P.map(
      ids,
      (id) =>
        gmail.users.messages
          .get({
            id: id,
            userId: 'me',
            format: 'metadata',
            metadataHeaders: [
              'From',
              'To',
              'Subject',
              'Reply-To',
              'In-Reply-To',
              'References',
              'Message-Id',
            ],
          })
          .then((r) => r.data),
      { concurrency: 3 },
    );

    return messages;
  }

  messageIterator(
    gmail: gmail_v1.Gmail,
    params: Omit<gmail_v1.Params$Resource$Users$Messages$List, 'maxResults'>,
    max: number = 10000,
  ) {
    return this._createIterator<gmail_v1.Schema$Message[], string>(
      async ({ next, n }) => {
        const maxResults =
          max - n > MAX_MESSAGE_PER_FETCH ? MAX_MESSAGE_PER_FETCH : max - n;

        const listResponse = await gmail.users.messages
          .list({
            userId: 'me',
            ...params,
            pageToken: next,
            maxResults,
          })
          .then((r) => r.data);

        return {
          data: listResponse.messages || [],
          next: listResponse.nextPageToken,
        };
      },
      { next: params.pageToken },
      max,
    );
  }

  async batchModifyMessages(
    gmail: gmail_v1.Gmail,
    messages: gmail_v1.Schema$Thread[],
    params: gmail_v1.Params$Resource$Users$Messages$Batchmodify,
  ) {
    if (!messages.length) {
      return [];
    }

    return gmail.users.messages
      .batchModify({
        userId: 'me',
        ...params,
        requestBody: {
          ...params.requestBody,
          ids: messages.map((m) => m.id),
        },
      })
      .then((r) => r.data);
  }

  async batchModifyThreads(
    gmail: gmail_v1.Gmail,
    threads: gmail_v1.Schema$Thread[],
    params: gmail_v1.Params$Resource$Users$Threads$Modify,
    concurrency: number = 5,
  ) {
    if (!threads.length) {
      return [];
    }

    return P.map(
      threads,
      (thread) => {
        return gmail.users.threads
          .modify({
            userId: 'me',
            ...params,
            id: thread.id,
          })
          .then((r) => r.data);
      },
      { concurrency },
    );
  }

  async replyGmail(
    gmail: gmail_v1.Gmail,
    id: string,
    composerOptions?: SendMailOptions,
  ) {
    if (!id) {
      throw new GenericException('Invalid message id.');
    }

    const messageDetail = await gmail.users.messages
      .get({
        id: id,
        userId: 'me',
        format: 'metadata',
        metadataHeaders: [
          'From',
          'To',
          'Subject',
          'Reply-To',
          'In-Reply-To',
          'References',
          'Message-Id',
        ],
      })
      .then((r) => r.data);

    const { payload, threadId } = messageDetail;

    if (!payload || !payload.headers) {
      throw new GenericException('Empty message headers.');
    }

    const headers = payload.headers.reduce((p, h) => {
      p[h.name.toLowerCase()] = h.value;
      p[h.name] = h.value;
      return p;
    }, {});

    const from = headers['From'];
    const to = headers['To'];
    const replyTo = headers['Reply-To'];
    const subject = headers['Subject'];
    const references = headers['References'];
    const messageId = headers['Message-Id'];
    const inReplyTo = headers['In-Reply-To'];

    if (!subject || !messageId) {
      throw new GenericException(
        "Cannot reply to message missing 'Subject' or 'Message-Id'",
      );
    }

    const composer = new MailComposer({
      text: 'Thank you for your information.',
      ...composerOptions,
      from: to,
      to: from,
      subject: subject.startsWith('Re: ') ? subject : `Re: ${subject}`,
      references: references || messageId,
      inReplyTo: inReplyTo || messageId,
      replyTo: replyTo,
    });

    const newMessage = await composer.compile().build();

    const raw = Buffer.from(newMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return gmail.users.messages
      .send({
        userId: 'me',
        requestBody: {
          threadId: threadId,
          raw,
        },
      })
      .then((r) => r.data);
  }

  async batchReplyGmail(
    gmail: gmail_v1.Gmail,
    messages: gmail_v1.Schema$Message[],
    composerOptions?: SendMailOptions,
    batchOptions: { concurrency: number } = { concurrency: 3 },
  ) {
    return P.map(
      messages,
      async (message) => {
        const result: Record<string, any> = Object.assign({}, message);
        try {
          const sent = await this.replyGmail(
            gmail,
            message.id,
            composerOptions,
          );
          result.sent = sent;
        } catch (err) {
          result.err = err?.message || 'Reply gmail error!';
        }
        return result;
      },
      batchOptions,
    );
  }
}
