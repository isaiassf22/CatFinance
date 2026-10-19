import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Epic 3: Transactions, Essential Declarations & Dashboard Unlock (Integration E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userA = {
    email: `cats_epic3_a_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  const userB = {
    email: `cats_epic3_b_${Date.now()}@catfinance.com`,
    password: 'password456',
  };

  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;
  let sheetAId: string;

  // Essential categories IDs
  let catMoradiaId: string;
  let catAlimentacaoId: string;
  let catTransporteId: string;
  let catSaudeId: string;
  let catEducacaoId: string;

  // Income category ID
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

    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userA);
    tokenA = resA.body.accessToken;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userB);
    tokenB = resB.body.accessToken;
    userBId = resB.body.user.id;

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

    // Create a sheet for User A in 2026/10
    const sheetRes = await request(app.getHttpServer())
      .post('/api/v1/sheets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ year: 2026, month: 10 });
    sheetAId = sheetRes.body.id;
  });

  afterAll(async () => {
    try {
      if (userAId || userBId) {
        await prisma.user.deleteMany({
          where: { id: { in: [userAId, userBId].filter(Boolean) } },
        });
      }
    } finally {
      await app.close();
    }
  });

  describe('1. Cents amount validation & Zero/Negative rejection (CB-05)', () => {
    it('CB-05: should reject amountCents = 0 (422)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Teste zero centavos',
          amountCents: 0,
          type: 'EXPENSE',
          categoryId: catMoradiaId,
          transactionDate: '2026-10-10',
          isRecurring: false,
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('CB-05: should reject negative amountCents (422)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Teste negativo',
          amountCents: -500,
          type: 'EXPENSE',
          categoryId: catMoradiaId,
          transactionDate: '2026-10-10',
          isRecurring: false,
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('CB-05: should reject float amounts (422)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Teste float',
          amountCents: 150.5,
          type: 'EXPENSE',
          categoryId: catMoradiaId,
          transactionDate: '2026-10-10',
          isRecurring: false,
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept integer amountCents >= 1 (201)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Salário de Outubro',
          amountCents: 350000,
          type: 'INCOME',
          categoryId: catSalarioId,
          transactionDate: '2026-10-05',
          isRecurring: false,
        })
        .expect(201);

      expect(response.body.transaction.amountCents).toBe(350000);
      expect(response.body.transaction.description).toBe('Salário de Outubro');
    });
  });

  describe('2. Strict Date Validation inside sheet month/year (CB-07, DEC-14)', () => {
    it('CB-07: should reject transactionDate outside of sheet month/year (400)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Compra em Novembro em planilha de Outubro',
          amountCents: 2500,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2026-11-01',
          isRecurring: false,
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TRANSACTION_DATE');
    });

    it('CB-07: should reject transactionDate in different year (400)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Compra em 2025',
          amountCents: 2500,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2025-10-15',
          isRecurring: false,
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TRANSACTION_DATE');
    });
  });

  describe('3. Category Type Mismatch & IDOR Isolation (CB-01)', () => {
    it('should reject INCOME category on EXPENSE transaction (400)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Despesa com categoria de receita',
          amountCents: 5000,
          type: 'EXPENSE',
          categoryId: catSalarioId, // Salário is INCOME
          transactionDate: '2026-10-10',
          isRecurring: false,
        })
        .expect(400);

      expect(response.body.error.code).toBe('CATEGORY_TYPE_MISMATCH');
    });

    it('CB-01: User B cannot add transaction to User A sheet (404)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          description: 'Ataque IDOR de User B',
          amountCents: 1000,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2026-10-10',
          isRecurring: false,
        })
        .expect(404);

      expect(response.body.error.code).toBe('SHEET_NOT_FOUND');
    });
  });

  describe('4. Essential Declarations & Automatic Transition (CB-11, DEC-12)', () => {
    it('should allow "Não tenho esse gasto" declaration for essential category (201)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/essential-declarations`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId: catEducacaoId })
        .expect(201);

      expect(response.body.declarationId).toBeDefined();
      expect(response.body.dashboardUnlockedNow).toBe(false);
    });

    it('CB-11: adding real expense automatically removes declaration (201)', async () => {
      // User registers real expense in Educação
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Curso de Finanças',
          amountCents: 15000,
          type: 'EXPENSE',
          categoryId: catEducacaoId,
          transactionDate: '2026-10-12',
          isRecurring: false,
        })
        .expect(201);

      expect(response.body.removedDeclaration).toBe(true);

      // Verify declaration is gone from sheet details
      const sheetDetail = await request(app.getHttpServer())
        .get('/api/v1/sheets/2026/10')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const educacaoStatus = sheetDetail.body.essentialsStatus.find(
        (s: any) => s.categoryId === catEducacaoId
      );
      expect(educacaoStatus.isFilled).toBe(true);
      expect(educacaoStatus.filledBy).toBe('TRANSACTION');
      expect(educacaoStatus.amountCents).toBe(15000);
    });

    it('should block declaration if real expense already exists in that category (409)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/essential-declarations`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId: catEducacaoId })
        .expect(409);

      expect(response.body.error.code).toBe('DECLARATION_BLOCKED_BY_EXPENSE');
    });
  });

  describe('5. Permanent Dashboard Unlock (CB-09, CB-10, DEC-05)', () => {
    it('CB-10: dashboard should be initially locked', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(meRes.body.dashboardUnlocked).toBe(false);
    });

    it('CB-09: completing all 5 essentials in same sheet unlocks dashboard permanently', async () => {
      // 1. Moradia -> Declaração "Não tenho esse gasto"
      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/essential-declarations`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId: catMoradiaId })
        .expect(201);

      // 2. Alimentação -> Despesa real
      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Supermercado',
          amountCents: 45000,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2026-10-14',
          isRecurring: false,
        })
        .expect(201);

      // 3. Transporte -> Despesa real
      await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Metrô e ônibus',
          amountCents: 22000,
          type: 'EXPENSE',
          categoryId: catTransporteId,
          transactionDate: '2026-10-16',
          isRecurring: false,
        })
        .expect(201);

      // 4. Educação já foi preenchida no teste anterior!

      // 5. Saúde -> Declaração "Não tenho esse gasto" (ÚLTIMA que faltava!)
      const lastRes = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/essential-declarations`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ categoryId: catSaudeId })
        .expect(201);

      // Deve desbloquear o Dashboard agora!
      expect(lastRes.body.dashboardUnlockedNow).toBe(true);

      // Verificar via GET /me
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(meRes.body.dashboardUnlocked).toBe(true);
    });
  });

  describe('6. Update and Delete Transaction (DEC-33)', () => {
    let txToEditId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sheets/${sheetAId}/transactions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Lanche padaria',
          amountCents: 1500,
          type: 'EXPENSE',
          categoryId: catAlimentacaoId,
          transactionDate: '2026-10-20',
          isRecurring: false,
        });
      txToEditId = res.body.transaction.id;
    });

    it('should update transaction description and amount', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${txToEditId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          description: 'Lanche padaria gourmet',
          amountCents: 2250,
        })
        .expect(200);

      expect(res.body.transaction.description).toBe('Lanche padaria gourmet');
      expect(res.body.transaction.amountCents).toBe(2250);
    });

    it('CB-01: User B cannot edit User A transaction (404)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${txToEditId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ description: 'Tentativa de alteração' })
        .expect(404);
    });

    it('should delete transaction (204)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${txToEditId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);

      const inDb = await prisma.transaction.findUnique({
        where: { id: txToEditId },
      });
      expect(inDb).toBeNull();
    });
  });
});
