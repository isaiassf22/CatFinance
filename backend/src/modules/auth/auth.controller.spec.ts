import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto = { email: 'test@catfinance.com', password: 'password123' };
      const expected = {
        accessToken: 'jwt-123',
        user: {
          id: 'u-1',
          email: 'test@catfinance.com',
          dashboardUnlocked: false,
          onboardingCompleted: false,
        },
      };

      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto = { email: 'test@catfinance.com', password: 'password123' };
      const expected = {
        accessToken: 'jwt-123',
        user: {
          id: 'u-1',
          email: 'test@catfinance.com',
          dashboardUnlocked: false,
          onboardingCompleted: false,
        },
      };

      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });
});
