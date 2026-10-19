import { Module } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { TransactionsController } from './transactions.controller';

@Module({
  controllers: [SheetsController, TransactionsController],
  providers: [SheetsService],
  exports: [SheetsService],
})
export class SheetsModule {}
