import { Controller, Get, Query, UsePipes, Logger, BadRequestException, } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import moment from 'moment';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ClubWithAvailability, GetAvailabilityQuery,
} from '../../domain/commands/get-availaiblity.query';

export const GetAvailabilitySchema = z.object({
  placeId: z.string().nonempty({ message: 'placeId is required.' }),
  date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/, { message: 'Invalid date format. Use YYYY-MM-DD.' })
    .refine((date) => moment(date).isValid(), { message: 'Invalid date.' })
    .refine((date) => !moment(date).isBefore(moment(), 'day'), {
      message: 'Date cannot be in the past.',
    })
    .transform((date) => moment(date).toDate()),
});

class GetAvailabilityDTO extends createZodDto(GetAvailabilitySchema) {}

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly queryBus: QueryBus,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  @Get()
  @UsePipes(ZodValidationPipe)
  async searchAvailability(
    @Query() query: GetAvailabilityDTO,
  ): Promise<ClubWithAvailability[]> {
    // Validación explícita adicional
  if (moment(query.date).isBefore(moment(), 'day')) {
    throw new BadRequestException('Date cannot be in the past.');
  }
    this.logger.log(
      `Start processing request: placeId=${query.placeId}, date=${moment(query.date).format('YYYY-MM-DD')}`,
    );
    const start = Date.now();

    const cacheKey = `availability:${query.placeId}:${moment(query.date).format('YYYY-MM-DD')}`;
    let cachedResult: ClubWithAvailability[] | null = null;

    // Intentar obtener del caché
    const cacheStart = Date.now();
    try {
      cachedResult = await this.getCache<ClubWithAvailability[]>(cacheKey);
      const cacheTime = Date.now() - cacheStart;
      if (cachedResult) {
        this.logger.log(`Cache hit for key ${cacheKey}, time: ${cacheTime}ms`);
        return cachedResult;
      } else {
        this.logger.log(`Cache miss for key ${cacheKey}, time: ${cacheTime}ms`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to fetch cache for key ${cacheKey}: ${err.message}`);
    }

    // Ejecutar QueryBus
    const queryStart = Date.now();
    try {
      const result = await this.queryBus.execute(
        new GetAvailabilityQuery(query.placeId, query.date),
      );
      const queryTime = Date.now() - queryStart;
      this.logger.log(`QueryBus executed successfully, time: ${queryTime}ms`);

      // Guardar en caché
      const cacheSetStart = Date.now();
      await this.setCache(cacheKey, result, 3600);
      const cacheSetTime = Date.now() - cacheSetStart;
      this.logger.log(`Data cached for key ${cacheKey}, time: ${cacheSetTime}ms`);

      const totalTime = Date.now() - start;
      this.logger.log(`Request completed in ${totalTime}ms`);
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error executing QueryBus: ${err.message}`, err.stack);

      // Intentar devolver datos obsoletos
      try {
        cachedResult = await this.getCache<ClubWithAvailability[]>(cacheKey);
        if (cachedResult) {
          this.logger.warn('Returning stale cache due to QueryBus failure.');
          return cachedResult;
        }
      } catch (cacheError) {
        const cacheErr = cacheError as Error;
        this.logger.warn(`Failed to fetch stale cache for key ${cacheKey}: ${cacheErr.message}`);
      }

      throw new BadRequestException('Failed to fetch availability. Please try again later.');
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.redisClient.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching from Redis for key ${key}: ${err.message}`);
      return null;
    }
  }

  private async setCache<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      this.logger.log(`Data cached for key: ${key}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error setting Redis cache for key ${key}: ${err.message}`);
    }
  }
}