import { RedisService } from '../../infrastructure/services/redis.service';
import { GetAvailabilityHandler } from './get-availability.handler';
import { GetAvailabilityQuery } from '../commands/get-availaiblity.query';
import { AlquilaTuCanchaClient } from '../ports/aquila-tu-cancha.client';
import moment from 'moment';

describe('GetAvailabilityHandler', () => {
  let handler: GetAvailabilityHandler;
  let mockClient: jest.Mocked<AlquilaTuCanchaClient>;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Silencia console.error
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restaura los mocks
  });

  beforeEach(() => {
    mockClient = {
      getClubs: jest.fn(),
      getCourts: jest.fn(),
      getAvailableSlots: jest.fn(),
    } as jest.Mocked<AlquilaTuCanchaClient>;

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(), // Agregado para cumplir con la interfaz RedisService
    } as unknown as jest.Mocked<RedisService>;

    handler = new GetAvailabilityHandler(mockClient, mockRedisService);
  });

  it('handles errors when fetching clubs', async () => {
    mockClient.getClubs.mockRejectedValueOnce(new Error('API Error'));

    const placeId = '123';
    const date = new Date();

    await expect(
      handler.execute(new GetAvailabilityQuery(placeId, date))
    ).rejects.toThrow('Failed to fetch availability data');

    expect(mockRedisService.get).toHaveBeenCalledWith(`availability:${placeId}:${date}`);
    expect(mockRedisService.set).not.toHaveBeenCalled();
  });

  it('returns data from Redis cache if available', async () => {
    const cachedData = JSON.stringify([
      { id: 1, name: 'Club A', courts: [] },
    ]);
    mockRedisService.get.mockResolvedValueOnce(cachedData);

    const placeId = '123';
    const date = moment().add(1, 'days').toDate();

    const response = await handler.execute(
      new GetAvailabilityQuery(placeId, date),
    );

    expect(response).toEqual(JSON.parse(cachedData));
    expect(mockRedisService.get).toHaveBeenCalledTimes(1);
    expect(mockClient.getClubs).not.toHaveBeenCalled();
  });

  it('fetches data from API and sets it in Redis if cache is unavailable', async () => {
    mockRedisService.get.mockResolvedValueOnce(null);
    mockClient.getClubs.mockResolvedValueOnce([
      { id: 1, name: 'Club A', location: 'Location A' },
    ]);
    mockClient.getCourts.mockResolvedValueOnce([
      { id: 1, name: 'Court A', type: 'Grass' },
    ]);
    mockClient.getAvailableSlots.mockResolvedValueOnce([]);

    const placeId = '123';
    const date = moment().add(1, 'days').toDate();

    const response = await handler.execute(
      new GetAvailabilityQuery(placeId, date),
    );

    expect(response).toEqual([
      {
        id: 1,
        name: 'Club A',
        location: 'Location A',
        courts: [{ id: 1, name: 'Court A', type: 'Grass', available: [] }],
      },
    ]);
    expect(mockRedisService.get).toHaveBeenCalledTimes(1);
    expect(mockRedisService.set).toHaveBeenCalledTimes(1);
  });
});
