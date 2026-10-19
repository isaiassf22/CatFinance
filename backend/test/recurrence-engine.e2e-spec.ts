import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Epic 4: Monthly Recurrence Engine (Integration E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const user = {
    email: `cats_recurrence_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  let token: string;
  let userId: string;

  let catMoradiaId: string;
  let catPersonalizadaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register User
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(user);
    token = res.body.accessToken;
    userId = res.body.user.id;

    // Fetch essential system category
    const moradia = await prisma.category.findFirst({
      where: { name: 'Moradia', isSystem: true },
    });
    catMoradiaId = moradia!.id;

    // Create a custom category for User
    const catRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Streaming & Mídia', type: 'EXPENSE' });
    catPersonalizadaId = catRes.body.id;
  });

  afterAll(async () => {
    try {
      if (userId) {
        await prisma.user.deleteMany({
          where: { id: userId },
        });
      }
    } finally {
      await app.close();
    }
  });

  describe('1. Creation of Recurring Transaction & Rule generation (DEC-08, DEC-19)', () => {
    let janSheetId: string;
    let ruleId: string;

    it('should create recurring transaction in January and store RecurrenceRule with dayOfMonth = 31', async () => {
      // Create Sheet for 2025/01 (January)
      const sheetRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 1 });
      janSheetId = sheetRes.body.id;

      // Add a recurring transaction on day 31
      const txRes = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${janSheetId}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Aluguel do Ap',
          amountCents: 180000,
          type: 'EXPENSE',
          categoryId: catMoradiaId,
          transactionDate: '2025-01-31',
          isRecurring: true,
        })
        .expect(201);

      expect(txRes.body.transaction.recurrenceRuleId).toBeDefined();
      ruleId = txRes.body.transaction.recurrenceRuleId;

      // Check rule in database
      const rule = await prisma.recurrenceRule.findUnique({
        where: { id: ruleId },
      });
      expect(rule).toBeDefined();
      expect(rule!.dayOfMonth).toBe(31);
      expect(rule!.startYear).toBe(2025);
      expect(rule!.startMonth).toBe(1);
      expect(rule!.isActive).toBe(true);
    });

    it('CB-12: should automatically adjust day 31 to 28 in February non-leap year (2025/02)', async () => {
      // Create Sheet for February 2025 (non-leap year, 28 days)
      const febRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 2 });
      const febSheetId = febRes.body.id;

      // GET sheet details should show 1 pending recurrence
      const detailRes = await request(app.getHttpServer())
        .get('/api/v1/sheets/2025/2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(detailRes.body.pendingRecurrences).toHaveLength(1);
      expect(detailRes.body.pendingRecurrences[0].id).toBe(ruleId);

      // Apply recurrences to February sheet
      const applyRes = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${febSheetId}/recurrences/apply`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(applyRes.body.generatedCount).toBe(1);
      const generatedTx = applyRes.body.transactions[0];
      expect(generatedTx.transactionDate.split('T')[0]).toBe('2025-02-28');

      // The rule itself MUST STILL KEEP dayOfMonth = 31 (matrix rule preserved)
      const rule = await prisma.recurrenceRule.findUnique({
        where: { id: ruleId },
      });
      expect(rule!.dayOfMonth).toBe(31);
    });

    it('CB-12: should automatically adjust day 31 to 29 in February leap year (2024/02)', async () => {
      // Create Sheet for February 2024 (leap year, 29 days)
      const febLeapRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2024, month: 2 });
      const febLeapSheetId = febLeapRes.body.id;

      // Create a recurring transaction in 2024/01 with day 31
      const janLeapRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2024, month: 1 });

      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${janLeapRes.body.id}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Internet Fibra Bissexto',
          amountCents: 15000,
          type: 'EXPENSE',
          categoryId: catMoradiaId,
          transactionDate: '2024-01-31',
          isRecurring: true,
        });

      // Apply recurrences in 2024/02
      const applyRes = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${febLeapSheetId}/recurrences/apply`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      const generatedTx = applyRes.body.transactions.find(
        (t: any) => t.description === 'Internet Fibra Bissexto'
      );
      expect(generatedTx).toBeDefined();
      expect(generatedTx.transactionDate.split('T')[0]).toBe('2024-02-29');
    });

    it('CB-13 & DEC-17: applying recurrences twice concurrently/sequentially is 100% idempotent', async () => {
      // Create Sheet for 2025/03
      const marRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 3 });
      const marSheetId = marRes.body.id;

      // Concurrently fire applyRecurrences (simulating double click)
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/sheets/${marSheetId}/recurrences/apply`)
          .set('Authorization', `Bearer ${token}`)
          .send({}),
        request(app.getHttpServer())
          .post(`/api/v1/sheets/${marSheetId}/recurrences/apply`)
          .set('Authorization', `Bearer ${token}`)
          .send({}),
      ]);

      expect([200, 200]).toContain(res1.status);
      expect([200, 200]).toContain(res2.status);

      // Verify transactions in database for this sheet
      const txsInMar = await prisma.transaction.findMany({
        where: { sheetId: marSheetId },
      });

      // Ensure no duplicate recurrence rule transactions were created!
      const ruleIds = txsInMar.map((t) => t.recurrenceRuleId).filter(Boolean);
      const uniqueRuleIds = new Set(ruleIds);
      expect(ruleIds.length).toBe(uniqueRuleIds.size);
    });

    it('DEC-18: deleting a sheet does NOT delete or deactivate the RecurrenceRule', async () => {
      // Sheet 2025/03 has transactions linked to ruleId
      const marSheet = await prisma.monthlySheet.findUnique({
        where: { userId_year_month: { userId, year: 2025, month: 3 } },
      });

      // Delete March sheet
      await request(app.getHttpServer())
        .delete(`/api/v1/sheets/${marSheet!.id}?confirm=true`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Verify the recurrence rule is still active in database!
      const rule = await prisma.recurrenceRule.findUnique({
        where: { id: ruleId },
      });
      expect(rule).toBeDefined();
      expect(rule!.isActive).toBe(true);
    });

    it('CB-03: deleting a custom category cascades and deletes linked RecurrenceRules', async () => {
      // Create recurring transaction using catPersonalizadaId
      const aprRes = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 4 });

      const txRes = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${aprRes.body.id}/transactions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Assinatura Streaming',
          amountCents: 4500,
          type: 'EXPENSE',
          categoryId: catPersonalizadaId,
          transactionDate: '2025-04-10',
          isRecurring: true,
        })
        .expect(201);

      const customRuleId = txRes.body.transaction.recurrenceRuleId;
      expect(customRuleId).toBeDefined();

      // Delete custom category
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${catPersonalizadaId}?confirm=true`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // The rule must be deleted via cascade
      const ruleInDb = await prisma.recurrenceRule.findUnique({
        where: { id: customRuleId },
      });
      expect(ruleInDb).toBeNull();
    });
  });
});
