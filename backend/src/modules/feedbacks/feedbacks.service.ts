import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(userId: string | null, dto: CreateFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        message: dto.message,
        pageContext: dto.pageContext,
      },
    });

    return {
      id: feedback.id,
      message: feedback.message,
      pageContext: feedback.pageContext,
      createdAt: feedback.createdAt,
    };
  }
}
