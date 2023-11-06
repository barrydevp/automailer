import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { BulkWriteAccountDto, FindAccountRequestDto } from './dto';

@Controller('/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // @Post()
  // create(@Body() createAccountDto: CreateAccountDto) {
  //   return this.accountService.create(createAccountDto);
  // }

  @Get('/')
  find(@Query() query: FindAccountRequestDto) {
    return this.accountService.find(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Post('bulk-write')
  bulkWrite(@Body() body: BulkWriteAccountDto) {
    return this.accountService.bulkWrite(body);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
  //   return this.accountService.update(+id, updateAccountDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.accountService.remove(+id);
  // }
}
