import { z } from 'nestjs-zod/z';
import { Club } from '../model/club';
import { Court } from '../model/court';
import { Slot } from '../model/slot';

// Define el esquema Zod para validar los parámetros de entrada
export const GetAvailabilitySchema = z.object({
  placeId: z.string().nonempty('placeId is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => new Date(date) > new Date(), {
      message: 'Date must be in the future',
    }),
});

// Validador de entrada
export const validateQueryInput = (input: { placeId: string; date: string }) => {
  return GetAvailabilitySchema.parse(input);
};
// Clase para representar el query
export class GetAvailabilityQuery {
  constructor(readonly placeId: string, readonly date: Date) {}
}

// Interfaz para la estructura extendida de Club con disponibilidad
export interface ClubWithAvailability extends Club {
  courts: (Court & {
    available: Slot[];
  })[];
}