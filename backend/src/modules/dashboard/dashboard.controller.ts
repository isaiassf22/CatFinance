import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryDashboardDto, QueryDashboardSchema } from './dto/dashboard.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDashboard(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(QueryDashboardSchema)) query: QueryDashboardDto
  ) {
    return this.dashboardService.getDashboardData(userId, query);
  }
}
