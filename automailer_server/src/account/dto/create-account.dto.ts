import { eAccountType } from 'src/database/schemas/account.schema';
import { AccountCredential } from '../types';

export class CreateAccountDto {
  externalId?: string;

  type: eAccountType.GOOGLE;

  email: string;

  verifiedEmail?: boolean;

  name?: string;

  givenName?: string;

  familyName?: string;

  picture?: string;

  locale?: string;

  credentials: AccountCredential;
}
