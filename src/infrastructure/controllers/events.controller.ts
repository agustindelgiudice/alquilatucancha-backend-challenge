import { Body, Controller, Post, Logger, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UseZodGuard } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { ClubUpdatedEvent } from '../../domain/events/club-updated.event';
import { CourtUpdatedEvent } from '../../domain/events/court-updated.event';
import { SlotBookedEvent } from '../../domain/events/slot-booked.event';
import { SlotAvailableEvent } from '../../domain/events/slot-cancelled.event';

const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string(),
  start: z.string(),
  end: z.string(),
  _priority: z.number(),
});

export const ExternalEventSchema = z.union([
  z.object({
    type: z.enum(['booking_cancelled', 'booking_created']),
    clubId: z.number().int(),
    courtId: z.number().int(),
    slot: SlotSchema,
  }),
  z.object({
    type: z.literal('club_updated'),
    clubId: z.number().int(),
    fields: z.array(
      z.enum(['attributes', 'openhours', 'logo_url', 'background_url']),
    ),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    fields: z.array(z.enum(['attributes', 'name'])),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventBus: EventBus) {}

  @Post()
  @UseZodGuard('body', ExternalEventSchema)
  async receiveEvent(@Body() externalEvent: ExternalEventDTO) {
    try {
      this.logger.log(`Received external event: ${JSON.stringify(externalEvent)}`);

      // Usar `externalEvent` con discriminación de tipo
      if (externalEvent.type === 'booking_created') {
        this.logger.log(
          `Publishing SlotBookedEvent for clubId: ${externalEvent.clubId}, courtId: ${externalEvent.courtId}`,
        );
        this.eventBus.publish(
          new SlotBookedEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
      } else if (externalEvent.type === 'booking_cancelled') {
        this.logger.log(
          `Publishing SlotAvailableEvent for clubId: ${externalEvent.clubId}, courtId: ${externalEvent.courtId}`,
        );
        this.eventBus.publish(
          new SlotAvailableEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
      } else if (externalEvent.type === 'club_updated') {
        this.logger.log(
          `Publishing ClubUpdatedEvent for clubId: ${externalEvent.clubId}, fields: ${JSON.stringify(
            externalEvent.fields,
          )}`,
        );
        this.eventBus.publish(
          new ClubUpdatedEvent(externalEvent.clubId, externalEvent.fields),
        );
      } else if (externalEvent.type === 'court_updated') {
        this.logger.log(
          `Publishing CourtUpdatedEvent for clubId: ${externalEvent.clubId}, courtId: ${externalEvent.courtId}`,
        );
        this.eventBus.publish(
          new CourtUpdatedEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.fields,
          ),
        );
      } else {
        // Manejar eventos desconocidos con un error más claro
        this.logger.warn(
          `Unknown event type received: ${JSON.stringify(externalEvent.type)}`,
        );
        throw new BadRequestException(
          `Unsupported event type: ${JSON.stringify(externalEvent.type)}`,
        );
      }
    } catch (error) {
      const err = error as Error; // Asegurar que el error sea del tipo correcto
      this.logger.error(`Error processing event: ${err.message}`, err.stack);
      throw err; // Re-lanzar el error si es necesario
    }
  }
}