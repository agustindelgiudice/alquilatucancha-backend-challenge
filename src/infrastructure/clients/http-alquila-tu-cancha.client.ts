import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import moment from 'moment';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { firstValueFrom } from 'rxjs';

import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private readonly base_url: string;
  private readonly logger = new Logger(HTTPAlquilaTuCanchaClient.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRedis() private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {
    this.base_url = this.config.get<string>('ATC_BASE_URL', 'http://localhost:4000');
  }

  async getClubs(placeId: string): Promise<Club[]> {
    const cacheKey = `clubs:${placeId}`;
    const cachedClubs = await this.getCache<Club[]>(cacheKey);

    if (cachedClubs) {
      this.logger.log(`Cache hit for clubs with placeId: ${placeId}`);
      return cachedClubs;
    }

    try {
      const response: AxiosResponse<Club[]> = await firstValueFrom(
        this.httpService.get<Club[]>('/clubs', {
          baseURL: this.base_url,
          params: { placeId },
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      await this.setCache(cacheKey, response.data, 3600);
      return response.data;
    } catch (error) {
      this.handleHttpError('clubs', placeId, error);
      return [];
    }
  }

  async getCourts(clubId: number): Promise<Court[]> {
    const cacheKey = `courts:${clubId}`;
    const cachedCourts = await this.getCache<Court[]>(cacheKey);

    if (cachedCourts) {
      this.logger.log(`Cache hit for courts with clubId: ${clubId}`);
      return cachedCourts;
    }

    try {
      const response: AxiosResponse<Court[]> = await firstValueFrom(
        this.httpService.get<Court[]>(`/clubs/${clubId}/courts`, {
          baseURL: this.base_url,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      await this.setCache(cacheKey, response.data, 3600);
      return response.data;
    } catch (error) {
      this.handleHttpError('courts', clubId.toString(), error);
      return [];
    }
  }

  async getAvailableSlots(clubId: number, courtId: number, date: Date): Promise<Slot[]> {
    const formattedDate = moment(date).format('YYYY-MM-DD'); // Asegura que esto sea consistente
    const cacheKey = `slots:${clubId}:${courtId}:${formattedDate}`;
    const cachedSlots = await this.getCache<Slot[]>(cacheKey);
  
    if (cachedSlots) {
      this.logger.log(`Cache hit for slots with key: ${cacheKey}`);
      return cachedSlots;
    }
  
    try {
      const response: AxiosResponse<Slot[]> = await firstValueFrom(
        this.httpService.get<Slot[]>(`/clubs/${clubId}/courts/${courtId}/slots`, {
          baseURL: this.base_url,
          params: { date: formattedDate },
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
  
      await this.setCache(cacheKey, response.data, 3600);
      return response.data;
    } catch (error) {
      this.handleHttpError('slots', `${clubId}:${courtId}:${formattedDate}`, error);
      return [];
    }
  }
  

  private async getCache<T>(key: string): Promise<T | null> {
    try {
        this.logger.log(`Fetching from cache: ${key}`);
        const start = Date.now(); // Marca de inicio del tiempo

        const value = await this.redis.get(key);

        const duration = Date.now() - start; // Calcula el tiempo transcurrido
        this.logger.log(`Cache fetch for key "${key}" completed in ${duration}ms`);

        return value ? JSON.parse(value) : null;
    } catch (error) {
        this.logger.error(`Error fetching cache for key ${key}: ${(error as Error).message}`);
        return null;
    }
}


  private async setCache<T>(key: string, value: T, ttl: number = 60): Promise<void> {
    try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl); // TTL por defecto: 60 segundos
        this.logger.log(`Data cached for key: ${key} with TTL: ${ttl} seconds`);
    } catch (error) {
        this.logger.error(`Error setting cache for key ${key}: ${(error as Error).message}`);
    }
}


  private handleHttpError(context: string, identifier: string, error: unknown): void {
    const errorMessage = (error as Error).message || 'Unknown error';
    this.logger.error(`Error occurred in ${context} (${identifier}): ${errorMessage}`);
    if ('response' in (error as any)) {
      this.logger.error(`Response data: ${(error as any).response?.data}`);
    }
  }
}
