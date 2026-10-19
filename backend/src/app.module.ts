import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MeModule } from './modules/me/me.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SheetsModule } from './modules/sheets/sheets.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.currentPassword',
          'req.body.amountCents',
          'password',
          'currentPassword',
          'authorization',
          'amountCents',
          '*.password',
          '*.currentPassword',
          '*.authorization',
          '*.amountCents',
        ],
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                },
              }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60s
        limit: process.env.NODE_ENV === 'test' ? 1000 : 60, // 60 req/min global
      },
      {
        name: 'auth',
        ttl: 900000, // 15 min
        limit: process.env.NODE_ENV === 'test' ? 1000 : 10, // 10 req/15min on auth
      },
    ]),
    PrismaModule,
    AuthModule,
    MeModule,
    CategoriesModule,
    SheetsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
