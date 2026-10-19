import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Categories & Sheets Module (Integration E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userA = {
    email: `cats_a_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  const userB = {
    email: `cats_b_${Date.now()}@catfinance.com`,
    password: 'password456',
  };

  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

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
  });

  afterAll(async () => {
    try {
      if (userAId || userBId) {
        await prisma.user.deleteMany({
          where: { id: { in: [userAId, userBId].filter(Boolean) } },
        });
      }
    } catch {
      // ignore
    }
    await app.close();
  });

  describe('Categories: System & Custom', () => {
    let customCatIncomeId: string;
    let customCatExpenseId: string;

    it('should list standard system categories (14 total)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThanOrEqual(14);

      const moradia = response.body.items.find((c: any) => c.name === 'Moradia');
      expect(moradia).toBeDefined();
      expect(moradia.isEssential).toBe(true);
      expect(moradia.isSystem).toBe(true);
    });

    it('should filter categories by type=EXPENSE and type=INCOME', async () => {
      const resExpense = await request(app.getHttpServer())
        .get('/api/v1/categories?type=EXPENSE')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(resExpense.body.items.every((c: any) => c.type === 'EXPENSE')).toBe(true);

      const resIncome = await request(app.getHttpServer())
        .get('/api/v1/categories?type=INCOME')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(resIncome.body.items.every((c: any) => c.type === 'INCOME')).toBe(true);
    });

    it('should allow creating custom category in INCOME', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Freelance Design',
          type: 'INCOME',
        })
        .expect(201);

      expect(response.body.name).toBe('Freelance Design');
      expect(response.body.type).toBe('INCOME');
      expect(response.body.isSystem).toBe(false);
      customCatIncomeId = response.body.id;
    });

    it('CB-02: should allow SAME category name in opposite type (EXPENSE)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Freelance Design',
          type: 'EXPENSE',
        })
        .expect(201);

      expect(response.body.name).toBe('Freelance Design');
      expect(response.body.type).toBe('EXPENSE');
      customCatExpenseId = response.body.id;
    });

    it('should reject duplicate category name in SAME type (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: '  freelance design  ',
          type: 'INCOME',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('should reject creating category with standard system name in same type (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Moradia',
          type: 'EXPENSE',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('CB-01: User B cannot see User A custom category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const found = response.body.items.find(
        (c: any) => c.name === 'Freelance Design'
      );
      expect(found).toBeUndefined();
    });

    it('CB-01: User B cannot delete User A custom category (404)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${customCatIncomeId}?confirm=true`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should prevent deleting standard system category (403)', async () => {
      const sysCategories = await prisma.category.findMany({
        where: { isSystem: true },
      });
      const moradiaId = sysCategories.find((c) => c.name === 'Moradia')!.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${moradiaId}?confirm=true`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);

      expect(response.body.error.code).toBe('CANNOT_DELETE_SYSTEM_CATEGORY');
    });

    it('should require confirm=true to delete custom category (400)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${customCatIncomeId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.error.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should atomically delete custom category with confirm=true (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${customCatIncomeId}?confirm=true`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const inDb = await prisma.category.findUnique({
        where: { id: customCatIncomeId },
      });
      expect(inDb).toBeNull();
    });
  });

  describe('MonthlySheets: Creation, Navigation and Deletion', () => {
    let sheetIdA: string;

    it('should create a monthly sheet for User A in 2026/10 (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ year: 2026, month: 10 })
        .expect(201);

      expect(response.body.year).toBe(2026);
      expect(response.body.month).toBe(10);
      sheetIdA = response.body.id;
    });

    it('CB-08: should reject recreating existing month in same year (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ year: 2026, month: 10 })
        .expect(409);

      expect(response.body.error.code).toBe('SHEET_ALREADY_EXISTS');
    });

    it('CB-01: User B can create sheet in same year/month without conflict', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sheets')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ year: 2026, month: 10 })
        .expect(201);

      expect(response.body.id).not.toBe(sheetIdA);
    });

    it('should list sheets for year 2026 showing availableMonthsToCreate', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sheets?year=2026')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.existingSheets.length).toBe(1);
      expect(response.body.existingSheets[0].month).toBe(10);
      expect(response.body.availableMonthsToCreate).not.toContain(10);
      expect(response.body.availableMonthsToCreate).toContain(1);
      expect(response.body.availableMonthsToCreate).toContain(12);
    });

    it('should return sheet detail with summary and essentials status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sheets/2026/10')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.sheet.id).toBe(sheetIdA);
      expect(response.body.summary.incomeCents).toBe(0);
      expect(response.body.summary.expenseCents).toBe(0);
      expect(response.body.summary.balanceCents).toBe(0);
      expect(response.body.essentialsStatus.length).toBe(5);
    });

    it('CB-01: User B cannot delete User A sheet (404)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/sheets/${sheetIdA}?confirm=true`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      expect(response.body.error.code).toBe('SHEET_NOT_FOUND');
    });

    it('should reject sheet deletion without confirm=true (400)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/sheets/${sheetIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.error.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should atomically delete sheet with confirm=true (204)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/sheets/${sheetIdA}?confirm=true`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);

      const inDb = await prisma.monthlySheet.findUnique({
        where: { id: sheetIdA },
      });
      expect(inDb).toBeNull();
    });
  });
});
