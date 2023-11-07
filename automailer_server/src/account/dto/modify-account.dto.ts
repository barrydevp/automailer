import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['credentials', 'email', 'type']),
) {}

export class AccountIdDto {
  @IsString()
  _id: string;
}

export class BulkUpdateAccountDto extends UpdateAccountDto {
  @IsString()
  _id: string;
}

export class BulkWriteAccountDto {
  @IsArray()
  @IsOptional()
  update?: BulkUpdateAccountDto[];

  @IsArray()
  @IsOptional()
  delete?: AccountIdDto[];
}

export class ManualActionDto {
  @IsArray()
  ids: string[];
}
