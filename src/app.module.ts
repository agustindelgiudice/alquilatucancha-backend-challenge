import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { RedisModule } from '@nestjs-modules/ioredis';

// Infraestructura
import { SearchController } from './infrastructure/controllers/search.controller';
import { EventsController } from './infrastructure/controllers/events.controller';
import { TestRedisController } from './infrastructure/controllers/test-redis.controller';
import { HTTPAlquilaTuCanchaClient } from './infrastructure/clients/http-alquila-tu-cancha.client';
import { RedisService } from './infrastructure/services/redis.service';

// Dominio
import { ClubUpdatedHandler } from './domain/handlers/club-updated.handler';
import { GetAvailabilityHandler } from './domain/handlers/get-availability.handler';
import { ALQUILA_TU_CANCHA_CLIENT } from './domain/ports/aquila-tu-cancha.client';

// Variables de entorno para Redis
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

@Module({
  imports: [
    HttpModule,
    CqrsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Carga las variables de entorno
    }),
    RedisModule.forRoot({
      type: 'single', // Configuración para un único nodo Redis
      url: `redis://${redisHost}:${redisPort}`,
      options: {
        password: redisPassword,
        maxRetriesPerRequest: null,
      },
    }),
  ],
  controllers: [
    SearchController,
    EventsController,
    TestRedisController,
  ],
  providers: [
    Logger, // Servicio de logger global
    {
      provide: ALQUILA_TU_CANCHA_CLIENT,
      useClass: HTTPAlquilaTuCanchaClient, // Cliente HTTP para conectar con la API externa
    },
    GetAvailabilityHandler, // Handler para manejar disponibilidad
    ClubUpdatedHandler, // Handler para eventos de actualización de clubes
    RedisService, // Servicio para operaciones con Redis
  ],
})
export class AppModule {}
