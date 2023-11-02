import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

@Injectable()
export class GuserService {
  constructor(private config: ConfigService) {}

  getV2(auth: OAuth2Client) {
    return google.oauth2({ version: 'v2', auth });
  }
}
