import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  OnboardingDto,
  DeleteAccountDto,
} from './dto/auth.dto';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UnauthorizedException,
  InvalidConfirmationException,
  InvalidPasswordException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        dashboardUnlocked: true,
        onboardingCompleted: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        dashboardUnlocked: user.dashboardUnlocked,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        dashboardUnlocked: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async updateOnboarding(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: dto.completed,
      },
      select: {
        id: true,
        email: true,
        dashboardUnlocked: true,
        onboardingCompleted: true,
      },
    });

    return updated;
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    if (dto.confirmationText !== 'EXCLUIR') {
      throw new InvalidConfirmationException('Texto de confirmação deve ser exatamente "EXCLUIR"');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidPasswordException('Senha incorreta');
    }

    // Hard delete atômico em cascata
    await this.prisma.$transaction(async (tx) => {
      // Deletar usuário (Prisma schema possui onDelete: Cascade nas relações)
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
