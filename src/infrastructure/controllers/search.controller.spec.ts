import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { QueryBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import moment from 'moment';

describe('SearchController', () => {
  let controller: SearchController;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      quit: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mockRedisClient.quit(); // Cierra la conexión mockeada
  });

  it('should return cached data if available', async () => {
    const mockCache = [{ availability: [], name: 'Club A' }];
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockCache));

    const query = { placeId: '123', date: new Date() };

    const result = await controller.searchAvailability(query);

    expect(result).toEqual(mockCache);
    expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
  });

  it('should execute QueryBus and cache result if no cached data', async () => {
    const mockQueryResult = [{ availability: [], name: 'Club B' }];
    mockRedisClient.get.mockResolvedValueOnce(null);

    mockQueryBus.execute.mockResolvedValueOnce(mockQueryResult);
    const query = { placeId: '123', date: new Date() };

    const result = await controller.searchAvailability(query);

    expect(result).toEqual(mockQueryResult);
    expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `availability:${query.placeId}:${moment(query.date).format('YYYY-MM-DD')}`,
      JSON.stringify(mockQueryResult),
      'EX',
      3600,
    );
  });

  it('should log error and return stale cache on query failure', async () => {
    const loggerSpy = jest.spyOn(controller['logger'], 'error').mockImplementation();

    const mockStaleCache = [{ availability: [], name: 'Club C' }];
    mockRedisClient.get
      .mockResolvedValueOnce(null) // Primera llamada: No hay datos en caché primario
      .mockResolvedValueOnce(JSON.stringify(mockStaleCache)); // Segunda llamada: Datos obsoletos

    mockQueryBus.execute.mockRejectedValueOnce(new Error('Query failed'));

    const query = { placeId: '123', date: new Date() };
    const result = await controller.searchAvailability(query);

    expect(result).toEqual(mockStaleCache); // Se espera el caché obsoleto
    expect(mockRedisClient.get).toHaveBeenCalledTimes(2); // Dos intentos de obtener caché
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1); // QueryBus falla una vez
    expect(loggerSpy).toHaveBeenCalledWith(
      'Error executing QueryBus: Query failed',
      expect.any(String),
    );
  });

  it('should throw exception if query fails and no stale cache', async () => {
    mockRedisClient.get
      .mockResolvedValueOnce(null) // Primera llamada al caché (fallo)
      .mockResolvedValueOnce(null); // Segunda llamada al caché (sin datos)

    mockQueryBus.execute.mockRejectedValueOnce(new Error('Query failed'));

    const query = { placeId: '123', date: new Date() };

    await expect(controller.searchAvailability(query)).rejects.toThrow(
      'Failed to fetch availability. Please try again later.',
    );
    expect(mockRedisClient.get).toHaveBeenCalledTimes(2); // Dos intentos de caché
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw exception for invalid date', async () => {
    const query = { placeId: '123', date: moment().subtract(1, 'day').format('YYYY-MM-DD') };
  
    await expect(controller.searchAvailability(query as any)).rejects.toThrow('Date cannot be in the past.');
  
    // Verifica que Redis y QueryBus no sean llamados
    expect(mockRedisClient.get).not.toHaveBeenCalled();
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
  });
});
