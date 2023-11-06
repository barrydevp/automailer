import { eAccountType } from 'src/database/schemas/account.schema';
import { AccountCredential } from '../types';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsOptional()
  externalId?: string;

  @IsEnum(eAccountType)
  type: eAccountType.GOOGLE;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  verifiedEmail?: boolean;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  givenName?: string;

  @IsString()
  @IsOptional()
  familyName?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  // @ValidateNested()
  credentials: AccountCredential;
}
