import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & Me Module (Integration E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUserA = {
    email: `usera_${Date.now()}@catfinance.com`,
    password: 'password123',
  };

  const testUserB = {
    email: `userb_${Date.now()}@catfinance.com`,
    password: 'password456',
  };

  let tokenUserA: string;
  let tokenUserB: string;
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
  });

  afterAll(async () => {
    // Cleanup if any test user was left
    try {
      if (userAId) {
        await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId].filter(Boolean) } } });
      }
    } catch {
      // ignore
    }
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject password with less than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'shortpass@catfinance.com',
          password: 'short',
        })
        .expect(422);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should register User A successfully (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUserA)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUserA.email);
      expect(response.body.user.dashboardUnlocked).toBe(false);
      expect(response.body.user.onboardingCompleted).toBe(false);
      expect(response.body.user.passwordHash).toBeUndefined();

      tokenUserA = response.body.accessToken;
      userAId = response.body.user.id;
    });

    it('should reject registration with duplicate email (409)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUserA)
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should register User B successfully (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUserB)
        .expect(201);

      tokenUserB = response.body.accessToken;
      userBId = response.body.user.id;
      expect(userBId).not.toBe(userAId);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject invalid password (401)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserA.email,
          password: 'wrongPassword',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should login User A successfully (200)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUserA)
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.id).toBe(userAId);
    });
  });

  describe('GET /api/v1/me & IDOR Isolation', () => {
    it('should reject unauthenticated request (401)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return User A profile when called with User A token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      expect(response.body.id).toBe(userAId);
      expect(response.body.email).toBe(testUserA.email);
    });

    it('should return User B profile when called with User B token (Strict IDOR Isolation)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .expect(200);

      expect(response.body.id).toBe(userBId);
      expect(response.body.email).toBe(testUserB.email);
      expect(response.body.id).not.toBe(userAId);
    });
  });

  describe('PATCH /api/v1/me/onboarding', () => {
    it('should update onboardingCompleted to true for User A', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/me/onboarding')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ completed: true })
        .expect(200);

      expect(response.body.onboardingCompleted).toBe(true);
    });
  });

  describe('DELETE /api/v1/me (Atomic Hard Delete)', () => {
    it('should reject deletion if confirmationText is not EXCLUIR (422)', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          confirmationText: 'cancelar',
          currentPassword: testUserA.password,
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject deletion if password does not match (400)', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          confirmationText: 'EXCLUIR',
          currentPassword: 'wrongPassword',
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should perform atomic hard delete when confirmation is EXCLUIR and password is correct (204)', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          confirmationText: 'EXCLUIR',
          currentPassword: testUserA.password,
        })
        .expect(204);

      // Verify in DB that User A no longer exists
      const dbUser = await prisma.user.findUnique({
        where: { id: userAId },
      });
      expect(dbUser).toBeNull();
    });

    it('should deny access to deleted user token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(401);
    });
  });
});
