import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: any;

  beforeEach(async () => {
    // Mock del cliente Redis
    mockRedisClient = {
      get: jest.fn().mockResolvedValue('mockValue'),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'), // Mock del método quit
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'default_IORedisModuleConnectionToken', // Token que usa @InjectRedis por defecto
          useValue: mockRedisClient, // Mock del cliente Redis
        },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(redisService).toBeDefined();
  });

  it('should call redisClient.get with the correct key', async () => {
    const result = await redisService.get('testKey');
    expect(mockRedisClient.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('mockValue');
  });

  it('should call redisClient.set with the correct arguments without TTL', async () => {
    const result = await redisService.set('testKey', 'testValue');
    expect(mockRedisClient.set).toHaveBeenCalledWith('testKey', 'testValue');
    expect(result).toBe('OK');
  });

  it('should call redisClient.set with the correct arguments with TTL', async () => {
    const result = await redisService.set('testKey', 'testValue', 3600);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'testKey',
      'testValue',
      'EX',
      3600,
    );
    expect(result).toBe('OK');
  });

  it('should call redisClient.del with the correct key', async () => {
    const result = await redisService.delete('testKey');
    expect(mockRedisClient.del).toHaveBeenCalledWith('testKey');
    expect(result).toBe(1);
  });

  // Nueva prueba para claves inexistentes
  it('should return null for a non-existent key', async () => {
    mockRedisClient.get.mockResolvedValueOnce(null); // Configura el mock para devolver null
    const result = await redisService.get('nonExistentKey');
    expect(mockRedisClient.get).toHaveBeenCalledWith('nonExistentKey'); // Verifica la clave usada
    expect(result).toBeNull(); // Verifica que el resultado sea null
  });

  // Limpieza de recursos después de todas las pruebas
  afterAll(() => {
    jest.clearAllTimers(); // Limpia cualquier temporizador activo
    if (mockRedisClient && mockRedisClient.quit) {
      mockRedisClient.quit(); // Llama al método quit del mock
    }
  });
});