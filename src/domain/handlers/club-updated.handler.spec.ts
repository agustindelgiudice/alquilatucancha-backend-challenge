import { Test, TestingModule } from '@nestjs/testing';
import { ClubUpdatedHandler } from './club-updated.handler';
import { ClubUpdatedEvent } from '../events/club-updated.event';
import { Logger } from '@nestjs/common';

describe('ClubUpdatedHandler', () => {
  let handler: ClubUpdatedHandler;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubUpdatedHandler,
        { provide: Logger, useValue: mockLogger }, // Inyectamos el mockLogger
      ],
    }).compile();

    handler = module.get<ClubUpdatedHandler>(ClubUpdatedHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debe registrar el evento cuando se actualiza un club', () => {
    const event = new ClubUpdatedEvent(1, ['attributes', 'logo_url']);

    handler.handle(event);

    // Verificamos que el logger haya sido llamado correctamente
    expect(mockLogger.log).toHaveBeenCalledTimes(1);
    expect(mockLogger.log).toHaveBeenCalledWith('Club 1 updated');
  });
});