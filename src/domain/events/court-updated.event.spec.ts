import { CourtUpdatedEvent } from './court-updated.event';

describe('CourtUpdatedEvent', () => {
  it('should create an instance with valid fields', () => {
    // Datos de entrada
    const clubId = 1;
    const courtId = 10;
    const fields: ('attributes' | 'name')[] = ['attributes', 'name'];
    const event = new CourtUpdatedEvent(clubId, courtId, fields);
    
    expect(event.clubId).toBe(clubId);
    expect(event.courtId).toBe(courtId);
    expect(event.fields).toEqual(fields);
  });
});