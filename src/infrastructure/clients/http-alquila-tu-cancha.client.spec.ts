import { Test, TestingModule } from '@nestjs/testing';
import { HTTPAlquilaTuCanchaClient } from './http-alquila-tu-cancha.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { Redis } from 'ioredis';
import moment from 'moment';

describe('HTTPAlquilaTuCanchaClient', () => {
  let client: HTTPAlquilaTuCanchaClient;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let redisMock: jest.Mocked<Redis>;
  const BASE_URL = 'http://mock:4000';

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configService = {
      get: jest.fn().mockReturnValue(BASE_URL),
    } as unknown as jest.Mocked<ConfigService>;

    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HTTPAlquilaTuCanchaClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redisMock,
        },
      ],
    }).compile();

    client = module.get<HTTPAlquilaTuCanchaClient>(HTTPAlquilaTuCanchaClient);
  });

  describe('getClubs', () => {
    it('should return a list of clubs', async () => {
      const placeId = 'somePlaceId';
      const mockResponse: AxiosResponse = {
        data: [{ id: 1, name: 'Club 1', location: 'Location 1' }],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
        config: { headers: {} } as any,
        request: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));
      redisMock.get.mockResolvedValue(null);

      const result = await client.getClubs(placeId);
      expect(result).toEqual(mockResponse.data);

      expect(httpService.get).toHaveBeenCalledWith(
        '/clubs',
        expect.objectContaining({
          baseURL: BASE_URL,
          params: { placeId },
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const placeId = 'somePlaceId';
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await client.getClubs(placeId);
      expect(result).toEqual([]);
    });
  });

  describe('getCourts', () => {
    it('should return a list of courts', async () => {
      const clubId = 1;
      const mockResponse: AxiosResponse = {
        data: [{ id: 1, type: 'Grass', name: 'Court 1' }],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
        config: { headers: {} } as any,
        request: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));
      redisMock.get.mockResolvedValue(null);

      const result = await client.getCourts(clubId);
      expect(result).toEqual(mockResponse.data);

      expect(httpService.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/courts`,
        expect.objectContaining({
          baseURL: BASE_URL,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const clubId = 1;
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await client.getCourts(clubId);
      expect(result).toEqual([]);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return a list of available slots', async () => {
      const clubId = 1;
      const courtId = 1;
      const date = new Date('2023-12-28'); // Fecha utilizada para el test
      const formattedDate = moment(date).format('YYYY-MM-DD'); // Usa la misma lógica de formato
  
      const mockResponse: AxiosResponse = {
        data: [
          {
            price: 100,
            duration: 60,
            datetime: '2023-12-29T10:00:00Z',
            start: '10:00',
            end: '11:00',
            _priority: 1,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
        config: { headers: {} } as any,
        request: {},
      };
  
      httpService.get.mockReturnValue(of(mockResponse));
  
      const result = await client.getAvailableSlots(clubId, courtId, date);
      expect(result).toEqual(mockResponse.data);
  
      expect(httpService.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/courts/${courtId}/slots`,
        expect.objectContaining({
          baseURL: BASE_URL,
          params: { date: formattedDate },
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  
    it('should handle API errors gracefully', async () => {
      const clubId = 1;
      const courtId = 1;
      const date = new Date('2023-12-28');
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));
  
      const result = await client.getAvailableSlots(clubId, courtId, date);
      expect(result).toEqual([]);
    });
  });
  
});
