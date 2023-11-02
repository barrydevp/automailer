import { Injectable } from '@nestjs/common';
import { GoogleAuthService } from './auth/google-auth.service';
import { Oauth2CallbackQueryDto } from './auth/google-auth.dto';
import { GmailService } from './api/gmail.service';
import { GuserService } from './api/google-user.service';
import { AccountService } from 'src/account/account.service';
import { eAccountType } from 'src/database/schemas/account.schema';

@Injectable()
export class GoogleService {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly gmailService: GmailService,
    private readonly guserService: GuserService,
    private readonly accountService: AccountService,
  ) {}

  async oauth2Callback(query: Oauth2CallbackQueryDto) {
    const credential = await this.googleAuthService.oauth2Callback(query);

    const oauth = this.googleAuthService.getOauth2Client(credential);

    const gmail = this.gmailService.getV1(oauth);
    const guser = this.guserService.getV2(oauth);
    const gmailProfileReponse = await gmail.users.getProfile({ userId: 'me' });
    const userdataReponse = await guser.userinfo.get();

    const gmailProfile = gmailProfileReponse.data;
    const userdata = userdataReponse.data;

    return this.accountService.create({
      externalId: userdata.id,
      type: eAccountType.GOOGLE,
      email: gmailProfile.emailAddress || userdata.email,
      verifiedEmail: userdata.verified_email,
      name: userdata.name,
      givenName: userdata.given_name,
      familyName: userdata.family_name,
      picture: userdata.picture,
      locale: userdata.locale,
      credentials: {
        accessToken: credential.access_token,
        refreshToken: credential.refresh_token,
        scope: credential.scope,
        tokenType: credential.token_type,
        idToken: credential.id_token,
        expriryDate: new Date(credential.expiry_date),
      },
    });
  }
}
