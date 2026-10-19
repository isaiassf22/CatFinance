import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LessonsService } from './lessons.service';
import {
  UpdateLessonProgressDto,
  updateLessonProgressSchema,
  SubmitQuizDto,
  submitQuizSchema,
} from './dto/lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async listLessons(@CurrentUser('id') userId: string) {
    return this.lessonsService.listLessons(userId);
  }

  @Get(':id')
  async getLessonById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) lessonId: string,
  ) {
    return this.lessonsService.getLessonById(userId, lessonId);
  }

  @Patch(':id/progress')
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Body(new ZodValidationPipe(updateLessonProgressSchema))
    dto: UpdateLessonProgressDto,
  ) {
    return this.lessonsService.updateProgress(userId, lessonId, dto);
  }

  @Post(':id/quiz-submissions')
  @HttpCode(HttpStatus.OK)
  async submitQuiz(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Body(new ZodValidationPipe(submitQuizSchema)) dto: SubmitQuizDto,
  ) {
    return this.lessonsService.submitQuiz(userId, lessonId, dto);
  }
}
