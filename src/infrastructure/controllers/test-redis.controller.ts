import { Controller, Get, Query } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

@Controller('example') // Ruta base para los endpoints
export class TestRedisController {
  constructor(private readonly redisService: RedisService) {} // Inyección del servicio Redis

  @Get('set') // Endpoint para guardar un valor en Redis
  async setKey(
    @Query('key') key: string,
    @Query('value') value: string,
    @Query('ttl') ttl?: number, // TTL opcional (Time To Live)
  ): Promise<string> {
    await this.redisService.set(key, value, ttl);
    return `Key "${key}" set with value "${value}"`;
  }

  @Get('get') // Endpoint para recuperar un valor de Redis
  async getKey(@Query('key') key: string): Promise<string> {
    const value = await this.redisService.get(key);
    if (!value) {
      return `Key "${key}" not found`;
    }
    return `Value for key "${key}": ${value}`;
  }
}
