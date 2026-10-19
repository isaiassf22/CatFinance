import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Lessons & Feedbacks (E2E) - Passo 6 / Épico 6', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUserToken: string;
  let testUserId: string;
  let lesson1Id: string;
  let lesson2Id: string;
  let lesson1Questions: any[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register a fresh test user
    const uniqueEmail = `epic6_user_${Date.now()}@example.com`;
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: uniqueEmail, password: 'Password123!' })
      .expect(201);

    testUserToken = regRes.body.accessToken;
    testUserId = regRes.body.user.id;

    // Get seeded lessons
    const lessons = await prisma.lesson.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    expect(lessons.length).toBeGreaterThanOrEqual(5);
    lesson1Id = lessons[0].id;
    lesson2Id = lessons[1].id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.userLessonProgress.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.feedback.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
    await app.close();
  });

  describe('GET /api/v1/lessons (Listagem de Aulas & Bloqueio Sequencial CB-15)', () => {
    it('deve listar as 5 aulas com status correto: Aula 1 desbloqueada e Aula 2+ bloqueadas para usuário novo', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBe(5);

      const l1 = res.body.items.find((i: any) => i.orderIndex === 1);
      const l2 = res.body.items.find((i: any) => i.orderIndex === 2);
      const l3 = res.body.items.find((i: any) => i.orderIndex === 3);

      expect(l1.isLocked).toBe(false);
      expect(l1.isCompleted).toBe(false);
      expect(l2.isLocked).toBe(true);
      expect(l3.isLocked).toBe(true);
    });

    it('deve bloquear acesso direto a GET /api/v1/lessons/:id se a aula estiver bloqueada (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/lessons/${lesson2Id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });

    it('deve permitir acesso a GET /api/v1/lessons/:id na aula 1 e OMITIR correctOptionId de todas as questões', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/lessons/${lesson1Id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.id).toBe(lesson1Id);
      expect(res.body.cards).toBeDefined();
      expect(res.body.cards.length).toBeGreaterThanOrEqual(3);
      expect(res.body.questions).toBeDefined();
      expect(res.body.questions.length).toBeGreaterThanOrEqual(3);

      lesson1Questions = res.body.questions;

      // Verify correctOptionId is strictly omitted (Anti-cheating / Spec)
      for (const q of res.body.questions) {
        expect(q.correctOptionId).toBeUndefined();
        expect(q.prompt).toBeDefined();
        expect(q.options).toBeDefined();
      }

      lesson1Questions = res.body.questions;
    });
  });

  describe('PATCH /api/v1/lessons/:id/progress', () => {
    it('deve salvar o índice do último cartão visualizado', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/lessons/${lesson1Id}/progress`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ lastCardViewed: 2 })
        .expect(200);

      expect(res.body.lastCardViewed).toBe(2);
      expect(res.body.isCompleted).toBe(false);
    });
  });

  describe('POST /api/v1/lessons/:id/quiz-submissions (Regras CB-14, DEC-25, DEC-06)', () => {
    it('deve reprovar submissão com menos de 70% de acertos sem revelar alternativas corretas', async () => {
      // Intentionally wrong answers for all questions
      const wrongAnswers = lesson1Questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: 'WRONG_ID_9999',
      }));

      const res = await request(app.getHttpServer())
        .post(`/api/v1/lessons/${lesson1Id}/quiz-submissions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ answers: wrongAnswers })
        .expect(200);

      expect(res.body.approvedNow).toBe(false);
      expect(res.body.isLessonCompleted).toBe(false);
      expect(res.body.correctCount).toBe(0);
      expect(res.body.scorePercent).toBe(0);

      // Results must tell if correct/wrong without leaking correctOptionId
      for (const result of res.body.results) {
        expect(result.isCorrect).toBe(false);
        expect((result as any).correctOptionId).toBeUndefined();
      }

      // Lesson 2 must still be locked
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const l2 = listRes.body.items.find((i: any) => i.id === lesson2Id);
      expect(l2.isLocked).toBe(true);
    });

    it('deve aprovar submissão com >= 70% de acertos (CB-14) e desbloquear a próxima aula (CB-15)', async () => {
      // Fetch DB questions with correctOptionId to simulate correct answers
      const dbQuestions = await prisma.quizQuestion.findMany({
        where: { lessonId: lesson1Id },
      });

      const correctAnswers = dbQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionId: q.correctOptionId,
      }));

      const res = await request(app.getHttpServer())
        .post(`/api/v1/lessons/${lesson1Id}/quiz-submissions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ answers: correctAnswers })
        .expect(200);

      expect(res.body.approvedNow).toBe(true);
      expect(res.body.isLessonCompleted).toBe(true);
      expect(res.body.scorePercent).toBe(100);
      expect(res.body.correctCount).toBe(dbQuestions.length);

      // Verify that lesson 2 is now unlocked!
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const l1 = listRes.body.items.find((i: any) => i.id === lesson1Id);
      const l2 = listRes.body.items.find((i: any) => i.id === lesson2Id);

      expect(l1.isCompleted).toBe(true);
      expect(l1.bestScorePercent).toBe(100);
      expect(l2.isLocked).toBe(false);

      // Can now access lesson 2 details
      await request(app.getHttpServer())
        .get(`/api/v1/lessons/${lesson2Id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);
    });

    it('deve preservar perpetuamente a conclusão mesmo se o usuário refizer o quiz e tirar nota menor (DEC-06)', async () => {
      const wrongAnswers = lesson1Questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: 'WRONG_ID_9999',
      }));

      const res = await request(app.getHttpServer())
        .post(`/api/v1/lessons/${lesson1Id}/quiz-submissions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ answers: wrongAnswers })
        .expect(200);

      expect(res.body.approvedNow).toBe(false);
      // isLessonCompleted must remain true perpetuamente!
      expect(res.body.isLessonCompleted).toBe(true);
      // bestScorePercent must remain 100
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/lessons')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const l1 = listRes.body.items.find((i: any) => i.id === lesson1Id);
      expect(l1.isCompleted).toBe(true);
      expect(l1.bestScorePercent).toBe(100);
    });
  });

  describe('POST /api/v1/feedbacks (Caixa Simples de Feedback)', () => {
    it('deve registrar feedback de usuário autenticado associando seu userId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/feedbacks')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          message: 'Adorei a trilha de aulas e os confetes ao aprovar no quiz!',
          pageContext: '/learn',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.message).toBe('Adorei a trilha de aulas e os confetes ao aprovar no quiz!');
      expect(res.body.pageContext).toBe('/learn');

      const savedInDb = await prisma.feedback.findUnique({
        where: { id: res.body.id },
      });
      expect(savedInDb).toBeDefined();
      expect(savedInDb?.userId).toBe(testUserId);
      expect(savedInDb?.processedByAgent).toBe(false);
    });

    it('deve permitir registro de feedback anônimo sem token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/feedbacks')
        .send({
          message: 'Feedback anônimo sobre a tela de login.',
          pageContext: '/login',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();

      const savedInDb = await prisma.feedback.findUnique({
        where: { id: res.body.id },
      });
      expect(savedInDb).toBeDefined();
      expect(savedInDb?.userId).toBeNull();
    });

    it('deve rejeitar feedback com mensagem vazia (422)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/feedbacks')
        .send({
          message: '',
        })
        .expect(422);
    });
  });
});
