import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ValidationException } from '../exceptions/app.exception';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom') {
      return value;
    }
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationException('Dados inválidos', details);
      }
      throw new ValidationException('Falha na validação dos dados');
    }
  }
}
