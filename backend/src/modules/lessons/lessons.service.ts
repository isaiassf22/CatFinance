import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLessonProgressDto, SubmitQuizDto } from './dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async listLessons(userId: string) {
    const lessons = await this.prisma.lesson.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
        userProgress: {
          where: { userId },
        },
      },
    });

    // Determine lock state according to CB-15 and DEC-06:
    // Lesson #1 is always unlocked.
    // Lesson N is unlocked if Lesson N-1 isCompleted == true OR if Lesson N is already completed (DEC-06 perpetual).
    let previousLessonCompleted = true; // Lesson 1 base condition

    const items = lessons.map((lesson, idx) => {
      const progress = lesson.userProgress[0];
      const isCompleted = progress?.isCompleted ?? false;
      const bestScorePercent = progress?.bestScorePercent ?? 0;

      let isLocked = false;
      if (idx === 0) {
        isLocked = false;
      } else {
        // Locked if previous is NOT completed AND current is NOT completed
        isLocked = !previousLessonCompleted && !isCompleted;
      }

      // Update previousLessonCompleted for the next lesson in sequence
      previousLessonCompleted = isCompleted;

      return {
        id: lesson.id,
        orderIndex: lesson.orderIndex,
        title: lesson.title,
        summary: lesson.summary,
        isLocked,
        isCompleted,
        bestScorePercent,
        questionsCount: lesson._count.questions,
      };
    });

    return { items };
  }

  async getLessonById(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        cards: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        userProgress: {
          where: { userId },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    // Check if locked for user
    if (lesson.orderIndex > 1) {
      const currentProgress = lesson.userProgress[0];
      if (!currentProgress?.isCompleted) {
        // Check previous lesson completion
        const previousLesson = await this.prisma.lesson.findFirst({
          where: { orderIndex: lesson.orderIndex - 1 },
          include: {
            userProgress: {
              where: { userId },
            },
          },
        });

        const prevCompleted = previousLesson?.userProgress[0]?.isCompleted ?? false;
        if (!prevCompleted) {
          throw new ForbiddenException(
            'Esta aula está bloqueada. Conclua a aula anterior primeiro.',
          );
        }
      }
    }

    const progress = lesson.userProgress[0];

    // OMIT correctOptionId from questions for security / anti-cheating!
    const sanitizedQuestions = lesson.questions.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      prompt: q.prompt,
      options: q.options,
      createdAt: q.createdAt,
    }));

    return {
      id: lesson.id,
      orderIndex: lesson.orderIndex,
      title: lesson.title,
      summary: lesson.summary,
      progress: {
        lastCardViewed: progress?.lastCardViewed ?? 0,
        isCompleted: progress?.isCompleted ?? false,
        bestScorePercent: progress?.bestScorePercent ?? 0,
      },
      cards: lesson.cards,
      questions: sanitizedQuestions,
    };
  }

  async updateProgress(
    userId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    const progress = await this.prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        lastCardViewed: dto.lastCardViewed,
      },
      update: {
        lastCardViewed: dto.lastCardViewed,
      },
    });

    return {
      lessonId,
      lastCardViewed: progress.lastCardViewed,
      isCompleted: progress.isCompleted,
      bestScorePercent: progress.bestScorePercent,
    };
  }

  async submitQuiz(userId: string, lessonId: string, dto: SubmitQuizDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        userProgress: {
          where: { userId },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    const totalQuestions = lesson.questions.length;
    if (totalQuestions === 0) {
      throw new NotFoundException('Esta aula não possui perguntas cadastradas.');
    }

    // Map answers by questionId
    const answersMap = new Map(
      dto.answers.map((a) => [a.questionId, a.selectedOptionId]),
    );

    let correctCount = 0;
    // Results return whether each question was answered correctly,
    // WITHOUT revealing the correct option ID on wrong answers (DEC-25)
    const results = lesson.questions.map((question) => {
      const selectedOptionId = answersMap.get(question.id);
      const isCorrect = selectedOptionId === question.correctOptionId;
      if (isCorrect) {
        correctCount++;
      }
      return {
        questionId: question.id,
        isCorrect,
      };
    });

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    // CB-14: Approval >= 70% -> required correct: ceil(totalQuestions * 0.7)
    const requiredCorrect = Math.ceil(totalQuestions * 0.7);
    const approvedNow = correctCount >= requiredCorrect;

    const currentProgress = lesson.userProgress[0];
    const previousBest = currentProgress?.bestScorePercent ?? 0;
    const newBest = Math.max(previousBest, scorePercent);

    // DEC-06: Perpetual completion preservation. Once isCompleted is true, it NEVER reverts to false.
    const isLessonCompleted = Boolean(currentProgress?.isCompleted || approvedNow);

    await this.prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        isCompleted: isLessonCompleted,
        bestScorePercent: newBest,
        lastCardViewed: lesson.questions.length,
      },
      update: {
        isCompleted: isLessonCompleted,
        bestScorePercent: newBest,
      },
    });

    return {
      scorePercent,
      correctCount,
      totalQuestions,
      approvedNow,
      isLessonCompleted,
      results,
    };
  }
}
