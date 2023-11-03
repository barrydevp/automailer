import Promise from 'bluebird';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

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
    );
  }

  async batchModifyMessages(
    gmail: gmail_v1.Gmail,
    messages: gmail_v1.Schema$Thread[],
    params: gmail_v1.Params$Resource$Users$Messages$Batchmodify,
  ) {
    if (!messages.length) {
      return;
    }

    return gmail.users.messages.batchModify({
      userId: 'me',
      ...params,
      requestBody: {
        ...params.requestBody,
        ids: messages.map((m) => m.id),
      },
    });
  }

  async batchModifyThreads(
    gmail: gmail_v1.Gmail,
    threads: gmail_v1.Schema$Thread[],
    params: gmail_v1.Params$Resource$Users$Threads$Modify,
    concurrency: number = 5,
  ) {
    if (!threads.length) {
      return;
    }

    return pmap(
      threads,
      (thread) => {
        return gmail.users.threads.modify({
          userId: 'me',
          ...params,
          id: thread.id,
        });
      },
      { concurrency },
    );
  }
}
