import {
  Controller,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UpdateTransactionDto,
  UpdateTransactionSchema,
} from './dto/transaction.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTransactionSchema))
    dto: UpdateTransactionDto
  ) {
    return this.sheetsService.updateTransaction(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ) {
    await this.sheetsService.deleteTransaction(userId, id);
  }
}
