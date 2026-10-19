import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { AuthService } from '../auth/auth.service';

describe('MeController', () => {
  let controller: MeController;
  let authService: AuthService;

  const mockAuthService = {
    getMe: jest.fn(),
    updateOnboarding: jest.fn(),
    deleteAccount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<MeController>(MeController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('IDOR & User Isolation', () => {
    it('should strictly use userId from JWT token (Usuario_B cannot query Usuario_A)', async () => {
      const userAId = 'user-a-uuid';
      const userBId = 'user-b-uuid';

      mockAuthService.getMe.mockImplementation((id: string) => {
        if (id === userBId) {
          return Promise.resolve({
            id: userBId,
            email: 'userb@catfinance.com',
            dashboardUnlocked: false,
            onboardingCompleted: false,
          });
        }
        return Promise.resolve({
          id: userAId,
          email: 'usera@catfinance.com',
          dashboardUnlocked: true,
          onboardingCompleted: true,
        });
      });

      // When Usuario_B calls getMe, their token injects userBId
      const resultB = await controller.getMe(userBId);
      expect(mockAuthService.getMe).toHaveBeenCalledWith(userBId);
      expect(resultB.id).toBe(userBId);
      expect(resultB.email).toBe('userb@catfinance.com');
      expect(resultB.id).not.toBe(userAId);
    });
  });

  describe('getMe', () => {
    it('should return current user data', async () => {
      const expected = {
        id: 'u-1',
        email: 'cat@catfinance.com',
        dashboardUnlocked: false,
        onboardingCompleted: false,
      };
      mockAuthService.getMe.mockResolvedValue(expected);

      const result = await controller.getMe('u-1');
      expect(authService.getMe).toHaveBeenCalledWith('u-1');
      expect(result).toEqual(expected);
    });
  });

  describe('updateOnboarding', () => {
    it('should update onboarding for the authenticated user', async () => {
      const expected = {
        id: 'u-1',
        email: 'cat@catfinance.com',
        dashboardUnlocked: false,
        onboardingCompleted: true,
      };
      mockAuthService.updateOnboarding.mockResolvedValue(expected);

      const result = await controller.updateOnboarding('u-1', { completed: true });
      expect(authService.updateOnboarding).toHaveBeenCalledWith('u-1', { completed: true });
      expect(result).toEqual(expected);
    });
  });

  describe('deleteAccount', () => {
    it('should call deleteAccount for the authenticated user', async () => {
      mockAuthService.deleteAccount.mockResolvedValue(undefined);

      await controller.deleteAccount('u-1', {
        confirmationText: 'EXCLUIR',
        currentPassword: 'secretPassword',
      });

      expect(authService.deleteAccount).toHaveBeenCalledWith('u-1', {
        confirmationText: 'EXCLUIR',
        currentPassword: 'secretPassword',
      });
    });
  });
});
