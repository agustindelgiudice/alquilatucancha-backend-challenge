import { Test, TestingModule } from '@nestjs/testing';
import { TestRedisController } from './test-redis.controller';
import { RedisService } from '../services/redis.service';

describe('TestRedisController', () => {
  let controller: TestRedisController;
  let mockRedisService: any;

  beforeEach(async () => {
    mockRedisService = {
      get: jest.fn().mockResolvedValue('Value for key "key": value'),
      set: jest.fn().mockResolvedValue('Key "key" set with value "value"'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestRedisController],
      providers: [
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    controller = module.get<TestRedisController>(TestRedisController);
  });
  it('should call redisService.get with the correct key', async () => {
    const result = await controller.getKey('key');
    expect(mockRedisService.get).toHaveBeenCalledWith('key');
    expect(result).toBe('Value for key "key": Value for key "key\": value');
  });
  

  it('should call redisService.set with the correct arguments', async () => {
    const result = await controller.setKey('key', 'value', 3600);
    expect(mockRedisService.set).toHaveBeenCalledWith('key', 'value', 3600);
    expect(result).toBe('Key "key" set with value "value"');
  });
});
