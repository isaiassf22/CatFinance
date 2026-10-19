import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Epic 5: Dashboard Module & Essential Declarations Neutrality (Integration E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userLocked = {
    email: `cats_dash_locked_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  const userUnlocked = {
    email: `cats_dash_unlocked_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  let tokenLocked: string;
  let userLockedId: string;

  let tokenUnlocked: string;
  let userUnlockedId: string;

  let catMoradiaId: string;
  let catAlimentacaoId: string;
  let catTransporteId: string;
  let catSaudeId: string;
  let catEducacaoId: string;
  let catSalarioId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register User Locked
    const resL = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userLocked);
    tokenLocked = resL.body.accessToken;
    userLockedId = resL.body.user.id;

    // Register User Unlocked
    const resU = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userUnlocked);
    tokenUnlocked = resU.body.accessToken;
    userUnlockedId = resU.body.user.id;

    // Fetch essential system categories
    const categories = await prisma.category.findMany({
      where: { isSystem: true },
    });

    catMoradiaId = categories.find((c) => c.name === 'Moradia')!.id;
    catAlimentacaoId = categories.find((c) => c.name === 'Alimentação')!.id;
    catTransporteId = categories.find((c) => c.name === 'Transporte')!.id;
    catSaudeId = categories.find((c) => c.name === 'Saúde')!.id;
    catEducacaoId = categories.find((c) => c.name === 'Educação')!.id;
    catSalarioId = categories.find((c) => c.name === 'Salário')!.id;
  });

  afterAll(async () => {
    try {
      if (userLockedId || userUnlockedId) {
        await prisma.user.deleteMany({
          where: { id: { in: [userLockedId, userUnlockedId].filter(Boolean) } },
        });
      }
    } finally {
      await app.close();
    }
  });

  describe('1. Dashboard Access Control (RF-06, RF-10)', () => {
    it('should block dashboard access (403 DASHBOARD_LOCKED) when dashboardUnlocked is false', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${tokenLocked}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('DASHBOARD_LOCKED');
    });
  });

  describe('2. Unlocking via Declarations and Neutrality of Declarations (DEC-32, RF-10, RF-16)', () => {
    let unlockedSheetId: string;

    it(
      'should unlock dashboard when 5 essential declarations are registered, but dashboard shows empty state (hasData: false)',
      async () => {
        // Create Sheet for UserUnlocked in 2026/05
        const sheetRes = await request(app.getHttpServer())
          .post('/api/v1/sheets')
          .set('Authorization', `Bearer ${tokenUnlocked}`)
          .send({ year: 2026, month: 5 });
        unlockedSheetId = sheetRes.body.id;

        // Register 5 essential declarations ("Não tenho esse gasto")
        const essentialIds = [
          catMoradiaId,
          catAlimentacaoId,
          catTransporteId,
          catSaudeId,
          catEducacaoId,
        ];

        for (const catId of essentialIds) {
          await request(app.getHttpServer())
            .post(`/api/v1/sheets/${unlockedSheetId}/essential-declarations`)
            .set('Authorization', `Bearer ${tokenUnlocked}`)
            .send({ categoryId: catId })
            .expect(201);
        }

        // Check if user is now unlocked
        const meRes = await request(app.getHttpServer())
          .get('/api/v1/me')
          .set('Authorization', `Bearer ${tokenUnlocked}`)
          .expect(200);

        expect(meRes.body.dashboardUnlocked).toBe(true);

        // GET /dashboard must succeed (200), but hasData must be FALSE and all sums must be 0
        // because declarations never alter balance or charts (DEC-32, RF-10)
        const dashRes = await request(app.getHttpServer())
          .get('/api/v1/dashboard')
          .set('Authorization', `Bearer ${tokenUnlocked}`)
          .expect(200);

        expect(dashRes.body.hasData).toBe(false);
        expect(dashRes.body.incomeCents).toBe(0);
        expect(dashRes.body.expenseCents).toBe(0);
        expect(dashRes.body.balanceCents).toBe(0);
        expect(dashRes.body.expensesByCategory).toHaveLength(0);
        expect(dashRes.body.availablePeriods).toHaveLength(0);
      },
      60000
    );

    it('should calculate accurate amounts when real transactions are added and reflect only real transactions', async () => {
      // Add a real income of R$ 4.000,00 (400000 cents)
      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${unlockedSheetId}/transactions`)
        .set('Authorization', `Bearer ${tokenUnlocked}`)
        .send({
          description: 'Salário de Maio',
          amountCents: 400000,
          type: 'INCOME',
          categoryId: catSalarioId,
          transactionDate: '2026-05-05',
          isRecurring: false,
        })
        .expect(201);

      // Add a real expense of R$ 500,00 (50000 cents) in Alimentação
      // (This will also automatically remove the declaration for Alimentação!)
      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${unlockedSheetId}/transactions`)
        .set('Authorization', `Bearer ${tokenUnlocked}`)
        .send({
          description: 'Supermercado Mensal',
          amountCents: 50000,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2026-05-10',
          isRecurring: false,
        })
        .expect(201);

      // Query MONTHLY Dashboard
      const monthlyDash = await request(app.getHttpServer())
        .get('/api/v1/dashboard?view=MONTHLY&year=2026&month=5')
        .set('Authorization', `Bearer ${tokenUnlocked}`)
        .expect(200);

      expect(monthlyDash.body.hasData).toBe(true);
      expect(monthlyDash.body.incomeCents).toBe(400000);
      expect(monthlyDash.body.expenseCents).toBe(50000);
      expect(monthlyDash.body.balanceCents).toBe(350000);
      expect(monthlyDash.body.expensesByCategory).toHaveLength(1);
      expect(monthlyDash.body.expensesByCategory[0].categoryName).toBe('Alimentação');
      expect(monthlyDash.body.expensesByCategory[0].amountCents).toBe(50000);
      expect(monthlyDash.body.expensesByCategory[0].percentage).toBe(100);

      // Notice: The other 4 essential categories that still have declarations (Moradia, Transporte, Saúde, Educação)
      // DO NOT appear in expensesByCategory and did NOT sum R$ 0,00 in expenses!
      expect(
        monthlyDash.body.expensesByCategory.some(
          (c: any) => c.categoryName === 'Moradia'
        )
      ).toBe(false);

      // Query ANNUAL Dashboard
      const annualDash = await request(app.getHttpServer())
        .get('/api/v1/dashboard?view=ANNUAL&year=2026')
        .set('Authorization', `Bearer ${tokenUnlocked}`)
        .expect(200);

      expect(annualDash.body.hasData).toBe(true);
      expect(annualDash.body.incomeCents).toBe(400000);
      expect(annualDash.body.expenseCents).toBe(50000);
      expect(annualDash.body.balanceCents).toBe(350000);
      expect(annualDash.body.monthlyComparison).toHaveLength(12);
      expect(annualDash.body.monthlyComparison[4].month).toBe(5);
      expect(annualDash.body.monthlyComparison[4].incomeCents).toBe(400000);
    });
  });
});
