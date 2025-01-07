import { Controller, Get, Query } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

@Controller('example') // Base URL
export class TestRedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('set') // Endpoint para guardar clave-valor
  async setKey(
    @Query('key') key: string,
    @Query('value') value: string,
    @Query('ttl') ttl?: number,
  ): Promise<string> {
    await this.redisService.set(key, value, ttl);
    return `Key "${key}" set with value "${value}"`;
  }

  @Get('get') // Endpoint para recuperar clave
  async getKey(@Query('key') key: string): Promise<string | null> {
    const value = await this.redisService.get(key);
    return value ? `Value for key "${key}": ${value}` : `Key "${key}" not found`;
  }
}
