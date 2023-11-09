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
import {
  BulkWriteAccountDto,
  FindAccountRequestDto,
  ManualActionDto,
} from './dto';

@Controller('/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // @Post()
  // create(@Body() createAccountDto: CreateAccountDto) {
  //   return this.accountService.create(createAccountDto);
  // }

  @Get('/search')
  filter(@Query() query: FindAccountRequestDto) {
    return this.accountService.find(query);
  }

  @Get('/')
  findAll(@Query() query: FindAccountRequestDto) {
    return this.accountService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Post('bulk-write')
  bulkWrite(@Body() body: BulkWriteAccountDto) {
    return this.accountService.bulkWrite(body);
  }

  @Post('bulk-deactivate')
  bulkDeactivate(@Body() body: { ids: string[] }) {
    return this.accountService.bulkDeactivate(body.ids);
  }

  @Post('manual-trigger')
  async manualTrigger(@Body() body: ManualActionDto) {
    const data = await this.accountService.manualMoveGmailAndReply(body.ids);
    return {
      data,
    };
  }

  @Post(':id/gmail/list')
  listGmail(@Param('id') id: string, @Body() body: { ids: string[] }) {
    return this.accountService.listGmailBox(id, body.ids);
  }

  @Post(':id/gmail/reply')
  replyGmail(
    @Param('id') id: string,
    @Body() body: { reply: { id: string }[] },
  ) {
    return this.accountService.replyGmail(id, body.reply);
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
