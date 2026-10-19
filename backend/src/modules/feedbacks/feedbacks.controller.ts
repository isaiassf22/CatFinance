import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto, createFeedbackSchema } from './dto/feedback.dto';

@Controller('feedbacks')
@Public()
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createFeedbackSchema)) dto: CreateFeedbackDto,
  ) {
    const user = (req as any).user as { id: string } | undefined;
    const userId = user?.id ?? null;
    return this.feedbacksService.createFeedback(userId, dto);
  }
}
