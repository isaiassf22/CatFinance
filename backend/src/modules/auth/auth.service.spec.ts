import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UnauthorizedException,
  InvalidConfirmationException,
  InvalidPasswordException,
} from '../../common/exceptions/app.exception';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should hash password with bcrypt >= 10 rounds, create user and return accessToken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'cat@example.com',
        dashboardUnlocked: false,
        onboardingCompleted: false,
      });
      mockJwtService.signAsync.mockResolvedValue('jwt-token-123');

      const result = await service.register({
        email: 'cat@example.com',
        password: 'password123',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'cat@example.com' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'cat@example.com',
          passwordHash: expect.any(String),
        },
        select: {
          id: true,
          email: true,
          dashboardUnlocked: true,
          onboardingCompleted: true,
        },
      });

      // Verify bcrypt hash validity
      const createdHash = mockPrismaService.user.create.mock.calls[0][0].data.passwordHash;
      expect(await bcrypt.compare('password123', createdHash)).toBe(true);

      expect(result).toEqual({
        accessToken: 'jwt-token-123',
        user: {
          id: 'user-uuid-1',
          email: 'cat@example.com',
          dashboardUnlocked: false,
          onboardingCompleted: false,
        },
      });
    });

    it('should throw EmailAlreadyExistsException if email is already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'taken@example.com',
      });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(EmailAlreadyExistsException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return token and user profile', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'cat@example.com',
        passwordHash,
        dashboardUnlocked: true,
        onboardingCompleted: true,
      });
      mockJwtService.signAsync.mockResolvedValue('jwt-token-abc');

      const result = await service.login({
        email: 'cat@example.com',
        password: 'secret123',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token-abc',
        user: {
          id: 'user-uuid-1',
          email: 'cat@example.com',
          dashboardUnlocked: true,
          onboardingCompleted: true,
        },
      });
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password',
        })
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw InvalidCredentialsException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'cat@example.com',
        passwordHash,
      });

      await expect(
        service.login({
          email: 'cat@example.com',
          password: 'wrongPassword',
        })
      ).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe('getMe', () => {
    it('should return user profile by userId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'cat@example.com',
        dashboardUnlocked: false,
        onboardingCompleted: false,
      });

      const result = await service.getMe('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'cat@example.com',
        dashboardUnlocked: false,
        onboardingCompleted: false,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateOnboarding', () => {
    it('should update onboardingCompleted flag', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'cat@example.com',
        dashboardUnlocked: false,
        onboardingCompleted: true,
      });

      const result = await service.updateOnboarding('user-1', { completed: true });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { onboardingCompleted: true },
        select: {
          id: true,
          email: true,
          dashboardUnlocked: true,
          onboardingCompleted: true,
        },
      });
      expect(result.onboardingCompleted).toBe(true);
    });
  });

  describe('deleteAccount (Hard Delete Cascade)', () => {
    it('should perform hard delete in cascade when confirmationText is EXCLUIR and password is correct', async () => {
      const passwordHash = await bcrypt.hash('validPassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-delete-me',
        email: 'bye@example.com',
        passwordHash,
      });

      await service.deleteAccount('user-delete-me', {
        confirmationText: 'EXCLUIR',
        currentPassword: 'validPassword',
      });

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-delete-me' },
      });
    });

    it('should throw InvalidConfirmationException if confirmationText is not EXCLUIR', async () => {
      await expect(
        service.deleteAccount('user-1', {
          confirmationText: 'excluir' as any,
          currentPassword: 'pass',
        })
      ).rejects.toThrow(InvalidConfirmationException);
    });

    it('should throw InvalidPasswordException if currentPassword does not match', async () => {
      const passwordHash = await bcrypt.hash('validPassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash,
      });

      await expect(
        service.deleteAccount('user-1', {
          confirmationText: 'EXCLUIR',
          currentPassword: 'wrongPassword',
        })
      ).rejects.toThrow(InvalidPasswordException);
    });
  });
});
