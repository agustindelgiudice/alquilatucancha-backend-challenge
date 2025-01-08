import { validateQueryInput } from '../commands/get-availaiblity.query';
import { ZodError } from 'nestjs-zod/z';

// Valores válidos para las pruebas
const validPlaceId = '123';
const validDate = '2025-01-10'; // Fecha futura válida
const pastDate = '2024-01-01'; // Fecha pasada

describe('GetAvailabilityQuery', () => {
  it('should validate correct input', () => {
    const input = { placeId: validPlaceId, date: validDate };
    expect(() => validateQueryInput(input)).not.toThrow();
  });

  it('should throw error for missing placeId', () => {
    // Se incluye placeId vacío para cumplir con el esquema
    const input = { placeId: '', date: validDate };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for invalid date format', () => {
    const input = { placeId: validPlaceId, date: 'invalid-date' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for date in the past', () => {
    const input = { placeId: validPlaceId, date: pastDate };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });

  it('should throw error for multiple invalid fields', () => {
    const input = { placeId: '', date: 'invalid-date' };
    expect(() => validateQueryInput(input)).toThrowError(ZodError);
  });
});