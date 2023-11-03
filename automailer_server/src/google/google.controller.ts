import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { Oauth2CallbackQueryDto } from './auth/google-auth.dto';
import { GoogleService } from './google.service';
import { GoogleAuthService } from './auth/google-auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('auth-url')
  getAuthUrl(@Query('state') state?: string) {
    return this.googleAuthService.genAuthUrl({
      state,
    });
  }

  @Get('oauth2-callback')
  @Redirect(process.env.CONNECTOR_CALLBACK_URL || 'http://localhost:5173', 302)
  async oauth2Callback(@Query() query: Oauth2CallbackQueryDto) {
    await this.googleService.oauth2Callback(query);

    let url = this.config.get(
      'CONNECTOR_CALLBACK_URL',
      'http://localhost:5173',
    );

    if (query.state) {
      url = `${url}${query.state}`;
    }

    return {
      url,
    };
  }
}
