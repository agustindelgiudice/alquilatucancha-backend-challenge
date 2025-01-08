import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventBus } from '@nestjs/cqrs';
import {
  ClubUpdatedEvent,
  CourtUpdatedEvent,
  SlotBookedEvent,
  SlotAvailableEvent,
} from '@domain/events';

describe('EventsController', () => {
  let controller: EventsController;
  let mockEventBus: { publish: jest.Mock };

  beforeEach(async () => {
    mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should publish SlotBookedEvent on booking_created', async () => {
    const event = {
      type: 'booking_created' as const,
      clubId: 1,
      courtId: 2,
      slot: {
        price: 100,
        duration: 60,
        datetime: '2024-12-30T10:00:00Z',
        start: '10:00',
        end: '11:00',
        _priority: 1,
      },
    };

    await controller.receiveEvent(event);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      new SlotBookedEvent(event.clubId, event.courtId, event.slot),
    );
  });

  it('should publish SlotAvailableEvent on booking_cancelled', async () => {
    const event = {
      type: 'booking_cancelled' as const,
      clubId: 1,
      courtId: 2,
      slot: {
        price: 100,
        duration: 60,
        datetime: '2024-12-30T10:00:00Z',
        start: '10:00',
        end: '11:00',
        _priority: 1,
      },
    };

    await controller.receiveEvent(event);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      new SlotAvailableEvent(event.clubId, event.courtId, event.slot),
    );
  });

  it('should publish ClubUpdatedEvent on club_updated', async () => {
    const event = {
      type: 'club_updated' as const,
      clubId: 1,
      fields: ['attributes', 'logo_url'] as ('attributes' | 'openhours' | 'logo_url' | 'background_url')[],
    };

    await controller.receiveEvent(event);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      new ClubUpdatedEvent(event.clubId, event.fields),
    );
  });

  it('should publish CourtUpdatedEvent on court_updated', async () => {
    const event = {
      type: 'court_updated' as const,
      clubId: 1,
      courtId: 2,
      fields: ['name', 'attributes'] as ('name' | 'attributes')[],
    };

    await controller.receiveEvent(event);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      new CourtUpdatedEvent(event.clubId, event.courtId, event.fields),
    );
  });
});
