import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['credentials', 'email', 'type']),
) {}

export class BulkDeleteAccountDto {
  @IsString()
  _id: string;
}

export class BulkUpdateAccountDto extends UpdateAccountDto {
  @IsString()
  _id: string;
}

export class BulkWriteAccountDto {
  @IsArray()
  @ValidateNested()
  @IsOptional()
  update?: BulkUpdateAccountDto[];

  @IsArray()
  @ValidateNested()
  @IsOptional()
  delete?: BulkDeleteAccountDto[];
}
