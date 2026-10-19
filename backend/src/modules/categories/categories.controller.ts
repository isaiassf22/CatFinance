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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateCategoryDto,
  CreateCategorySchema,
} from './dto/category.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TransactionType } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listCategories(
    @CurrentUser('id') userId: string,
    @Query('type') type?: TransactionType
  ) {
    return this.categoriesService.listCategories(userId, type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateCategorySchema)) dto: CreateCategoryDto
  ) {
    return this.categoriesService.createCategory(userId, dto);
  }

  @Get(':id/delete-preview')
  @HttpCode(HttpStatus.OK)
  async getDeletePreview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ) {
    return this.categoriesService.getDeletePreview(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('confirm') confirm?: string
  ) {
    const isConfirmed = confirm === 'true';
    return this.categoriesService.deleteCategory(userId, id, isConfirmed);
  }
}
