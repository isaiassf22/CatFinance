import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type === 'Bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request['user'] = {
          id: payload.sub,
          email: payload.email,
        };
      } catch {
        // If token is invalid or expired, continue as unauthenticated
        request['user'] = undefined;
      }
    }

    return true;
  }
}
