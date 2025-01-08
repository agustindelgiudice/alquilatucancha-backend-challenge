import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlInSeconds?: number): Promise<'OK'> {
    if (ttlInSeconds) {
      return this.redisClient.set(key, value, 'EX', ttlInSeconds);
    }
    return this.redisClient.set(key, value);
  }

  async delete(key: string): Promise<number> {
    return this.redisClient.del(key);
  }
}