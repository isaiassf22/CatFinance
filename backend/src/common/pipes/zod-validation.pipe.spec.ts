import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { ValidationException } from '../exceptions/app.exception';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha muito curta'),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  it('should pass and return parsed value when input is valid', () => {
    const validData = {
      email: 'user@catfinance.com',
      password: 'password123',
    };

    const result = pipe.transform(validData, { type: 'body' });
    expect(result).toEqual(validData);
  });

  it('should throw ValidationException when validation fails', () => {
    const invalidData = {
      email: 'not-an-email',
      password: '123',
    };

    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(ValidationException);

    try {
      pipe.transform(invalidData, { type: 'body' });
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationException);
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    }
  });
});
