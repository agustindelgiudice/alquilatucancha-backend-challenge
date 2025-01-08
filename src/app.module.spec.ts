import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { RedisModule } from '@nestjs-modules/ioredis';

import { SearchController } from './infrastructure/controllers/search.controller';
import { EventsController } from './infrastructure/controllers/events.controller';
import { HTTPAlquilaTuCanchaClient } from './infrastructure/clients/http-alquila-tu-cancha.client';
import { GetAvailabilityHandler } from './domain/handlers/get-availability.handler';
import { ClubUpdatedHandler } from './domain/handlers/club-updated.handler';
import { ALQUILA_TU_CANCHA_CLIENT } from './domain/ports/aquila-tu-cancha.client';
import { Logger } from '@nestjs/common';
import { RedisService } from './infrastructure/services/redis.service';

describe('AppModule', () => {
  let app: TestingModule;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'REDIS_HOST':
          return 'redis'; // Ajusta al entorno esperado
        case 'REDIS_PORT':
          return 6379;
        default:
          return null;
      }
    }),
  };

  const redisClientMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [
        HttpModule,
        CqrsModule,
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'single',
            options: {
              host: configService.get('REDIS_HOST'),
              port: configService.get('REDIS_PORT'),
            },
          }),
        }),
      ],
      controllers: [SearchController, EventsController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ALQUILA_TU_CANCHA_CLIENT,
          useClass: HTTPAlquilaTuCanchaClient,
        },
        HTTPAlquilaTuCanchaClient,
        GetAvailabilityHandler,
        ClubUpdatedHandler,
        RedisService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redisClientMock,
        },
      ],
    }).compile();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should initialize the AppModule', () => {
    expect(app).toBeDefined();
  });

  it('should provide SearchController', () => {
    const controller = app.get<SearchController>(SearchController);
    expect(controller).toBeDefined();
  });

  it('should provide EventsController', () => {
    const controller = app.get<EventsController>(EventsController);
    expect(controller).toBeDefined();
  });

  it('should provide GetAvailabilityHandler', () => {
    const handler = app.get<GetAvailabilityHandler>(GetAvailabilityHandler);
    expect(handler).toBeDefined();
  });

  it('should provide ClubUpdatedHandler', () => {
    const handler = app.get<ClubUpdatedHandler>(ClubUpdatedHandler);
    expect(handler).toBeDefined();
  });

  it('should provide HTTPAlquilaTuCanchaClient', () => {
    const client = app.get<HTTPAlquilaTuCanchaClient>(HTTPAlquilaTuCanchaClient);
    expect(client).toBeDefined();
  });

  it('should bind ALQUILA_TU_CANCHA_CLIENT token to HTTPAlquilaTuCanchaClient', () => {
    const client = app.get<HTTPAlquilaTuCanchaClient>(ALQUILA_TU_CANCHA_CLIENT);
    expect(client).toBeDefined();
  });

  it('should configure RedisModule with correct values', () => {
    const redisConfig = app.get<ConfigService>(ConfigService);
    expect(redisConfig.get('REDIS_HOST')).toBe('redis');
    expect(Number(redisConfig.get('REDIS_PORT'))).toBe(6379);
  });
});