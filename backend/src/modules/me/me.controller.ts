import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  OnboardingDto,
  OnboardingSchema,
  DeleteAccountDto,
  DeleteAccountSchema,
} from '../auth/dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('me')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch('onboarding')
  @HttpCode(HttpStatus.OK)
  async updateOnboarding(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(OnboardingSchema)) dto: OnboardingDto
  ) {
    return this.authService.updateOnboarding(userId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(DeleteAccountSchema)) dto: DeleteAccountDto
  ) {
    await this.authService.deleteAccount(userId, dto);
  }
}
