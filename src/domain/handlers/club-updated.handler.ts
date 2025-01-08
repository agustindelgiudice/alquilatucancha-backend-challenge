import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClubUpdatedEvent } from '../events/club-updated.event';

@EventsHandler(ClubUpdatedEvent)
@Injectable()
export class ClubUpdatedHandler implements IEventHandler<ClubUpdatedEvent> {
  constructor(private readonly logger: Logger) {}

  handle(event: ClubUpdatedEvent) {
    this.logger.log(`Club ${event.clubId} updated`);
  }
}