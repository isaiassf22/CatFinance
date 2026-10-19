import { HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppException, ValidationException } from '../exceptions/app.exception';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  const createMockHost = (res: any) => ({
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({}),
    }),
  });

  it('should format AppException according to the API contract', () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const response = { status: statusMock };

    const host = createMockHost(response) as any;
    const exception = new AppException('TEST_ERROR', 'Mensagem de teste', HttpStatus.BAD_REQUEST, [
      { field: 'testField', message: 'Erro no campo' },
    ]);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: 'TEST_ERROR',
        message: 'Mensagem de teste',
        details: [{ field: 'testField', message: 'Erro no campo' }],
      },
    });
  });

  it('should format ValidationException with 422 and details', () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const response = { status: statusMock };

    const host = createMockHost(response) as any;
    const exception = new ValidationException('Dados inválidos', [
      { field: 'email', message: 'E-mail inválido' },
    ]);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: [{ field: 'email', message: 'E-mail inválido' }],
      },
    });
  });
});
