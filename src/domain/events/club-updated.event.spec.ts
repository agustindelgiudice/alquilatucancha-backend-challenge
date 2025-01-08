import { ClubUpdatedEvent } from './club-updated.event';

describe('ClubUpdatedEvent', () => {
  it('should create an instance with valid fields', () => {
    // Datos de entrada
    const clubId = 1;
    const fields: ('attributes' | 'openhours')[] = ['attributes', 'openhours'];
    const event = new ClubUpdatedEvent(clubId, fields);
    

    // Validar que los valores son los correctos
    expect(event.clubId).toBe(clubId);
    expect(event.fields).toEqual(fields);
  });
});