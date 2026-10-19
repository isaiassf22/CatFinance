import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class AppException extends HttpException {
  public readonly errorMessage: string;

  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details: ApiErrorDetail[] = []
  ) {
    super({ error: { code, message, details } }, status);
    this.errorMessage = message;
  }
}

export class ValidationException extends AppException {
  constructor(message = 'Dados inválidos', details: ApiErrorDetail[] = []) {
    super('VALIDATION_ERROR', message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export class InvalidCredentialsException extends AppException {
  constructor(message = 'E-mail ou senha incorretos') {
    super('INVALID_CREDENTIALS', message, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyExistsException extends AppException {
  constructor(message = 'Este e-mail já está em uso') {
    super('EMAIL_ALREADY_EXISTS', message, HttpStatus.CONFLICT);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Não autorizado') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidConfirmationException extends AppException {
  constructor(message = 'Texto de confirmação inválido') {
    super('INVALID_CONFIRMATION', message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidPasswordException extends AppException {
  constructor(message = 'Senha incorreta') {
    super('INVALID_PASSWORD', message, HttpStatus.BAD_REQUEST);
  }
}
