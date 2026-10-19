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

export class CategoryAlreadyExistsException extends AppException {
  constructor(message = 'Já existe uma categoria com este nome para este tipo') {
    super('CATEGORY_ALREADY_EXISTS', message, HttpStatus.CONFLICT);
  }
}

export class CannotDeleteSystemCategoryException extends AppException {
  constructor(message = 'Categorias padrão do sistema não podem ser excluídas') {
    super('CANNOT_DELETE_SYSTEM_CATEGORY', message, HttpStatus.FORBIDDEN);
  }
}

export class CategoryNotFoundException extends AppException {
  constructor(message = 'Categoria não encontrada') {
    super('CATEGORY_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class ConfirmationRequiredException extends AppException {
  constructor(message = 'Confirmação explícita é obrigatória (?confirm=true)') {
    super('CONFIRMATION_REQUIRED', message, HttpStatus.BAD_REQUEST);
  }
}

export class SheetAlreadyExistsException extends AppException {
  constructor(message = 'Já existe uma planilha criada para este ano e mês') {
    super('SHEET_ALREADY_EXISTS', message, HttpStatus.CONFLICT);
  }
}

export class SheetNotFoundException extends AppException {
  constructor(message = 'Planilha não encontrada para o período informado') {
    super('SHEET_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}
