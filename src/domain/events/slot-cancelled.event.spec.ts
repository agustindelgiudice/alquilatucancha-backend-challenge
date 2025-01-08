import { SlotAvailableEvent } from './slot-cancelled.event';
import { Slot } from '../model/slot';

describe('SlotAvailableEvent', () => {
  it('should create an instance with a valid slot', () => {
    // Datos de entrada
    const clubId = 1;
    const courtId = 20;
    const slot: Slot = {
        price: 100,
        duration: 60,
        datetime: '2022-12-05T10:00:00Z',
        start: '10:00',
        end: '11:00',
        _priority: 1, // Agregar esta propiedad
      };
      

    // Crear instancia del evento
    const event = new SlotAvailableEvent(clubId, courtId, slot);

    // Validar que los valores son los correctos
    expect(event.clubId).toBe(clubId);
    expect(event.courtId).toBe(courtId);
    expect(event.slot).toEqual(slot);
  });
});