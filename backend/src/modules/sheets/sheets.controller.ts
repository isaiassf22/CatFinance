import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSheetDto, CreateSheetSchema } from './dto/sheet.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listSheets(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string
  ) {
    const parsedYear = year ? parseInt(year, 10) : undefined;
    return this.sheetsService.listSheets(userId, parsedYear);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSheet(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateSheetSchema)) dto: CreateSheetDto
  ) {
    return this.sheetsService.createSheet(userId, dto);
  }

  @Get(':year/:month')
  @HttpCode(HttpStatus.OK)
  async getSheetDetail(
    @CurrentUser('id') userId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number
  ) {
    return this.sheetsService.getSheetDetail(userId, year, month);
  }

  @Delete(':sheetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSheet(
    @CurrentUser('id') userId: string,
    @Param('sheetId') sheetId: string,
    @Query('confirm') confirm?: string
  ) {
    const isConfirmed = confirm === 'true';
    await this.sheetsService.deleteSheet(userId, sheetId, isConfirmed);
  }
}
