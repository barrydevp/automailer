import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { join } from 'path';
import { promises as fs } from 'node:fs';
import { Oauth2CallbackQueryDto } from './google-auth.dto';

const SCOPES = [
  'https://mail.google.com/',
  // 'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

const TOKEN_PATH = join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = join(process.cwd(), 'credentials.json');

export type GenAuthUrlArgs = {
  state?: string;
  scopes?: string[];
};

@Injectable()
export class GoogleAuthService {
  private baseClient: OAuth2Client;

  constructor(private config: ConfigService) {
    this.baseClient = this.getOauth2Client();
  }

  getOauth2Client(credentials?: Credentials): OAuth2Client {
    const oauth = new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID', ''),
      this.config.get('GOOGLE_CLIENT_SECRET', ''),
      this.config.get('GOOGLE_REDIRECT_URL', ''),
    );
    if (credentials) {
      oauth.setCredentials(credentials);
    }
    return oauth;
  }

  genAuthUrl(args?: GenAuthUrlArgs) {
    const request = {
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',

      // Pass in the scopes array defined above.
      // Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: args?.scopes || SCOPES,

      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,

      // FIXME: Use config instead
      // redirect_uri: 'http://localhost:3000/api/google/oauth2-callback',

      // TODO: future use optional
      state: args?.state,
    };
    const url = this.baseClient.generateAuthUrl(request);

    return {
      url,
      request,
    };
  }

  async oauth2Callback(query: Oauth2CallbackQueryDto) {
    // Handle the OAuth 2.0 server response
    if (query.error) {
      // An error response e.g. error=access_denied
      throw new BadRequestException(query.error);
    }

    // Get access and refresh tokens (if access_type is offline)
    const { tokens } = await this.baseClient
      .getToken(query.code)
      .catch((err) => {
        throw new UnprocessableEntityException(err.message);
      });

    return tokens;
  }

  async oauth2Revoke(credentials: Credentials) {
    const oauth = this.getOauth2Client(credentials);
    return oauth.revokeCredentials();
  }

  /// Reads previously authorized credentials from the save file.
  async loadSavedCredentialsIfExist() {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content.toString());
    return google.auth.fromJSON(credentials);
  }

  /// Serializes credentials to a file compatible with GoogleAUth.fromJSON.
  async saveCredentials(client: OAuth2Client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }

  // async getProfileByToken(
  //   loginDto: AuthGoogleLoginDto,
  // ): Promise<SocialInterface> {
  //   const ticket = await this.google.verifyIdToken({
  //     idToken: loginDto.idToken,
  //     audience: [
  //       this.configService.getOrThrow('google.clientId', { infer: true }),
  //     ],
  //   });
  //
  //   const data = ticket.getPayload();
  //
  //   if (!data) {
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           user: 'wrongToken',
  //         },
  //       },
  //       HttpStatus.UNPROCESSABLE_ENTITY,
  //     );
  //   }
  //
  //   return {
  //     id: data.sub,
  //     email: data.email,
  //     firstName: data.given_name,
  //     lastName: data.family_name,
  //   };
  // }
}
