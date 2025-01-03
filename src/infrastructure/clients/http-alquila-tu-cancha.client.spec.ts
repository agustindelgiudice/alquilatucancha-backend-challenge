import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import moment from 'moment';

import { HTTPAlquilaTuCanchaClient } from './http-alquila-tu-cancha.client';
import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';

describe('HTTPAlquilaTuCanchaClient', () => {
  let client: HTTPAlquilaTuCanchaClient;
  let httpService: jest.Mocked<HttpService>;
  let redisMock: any;

  const BASE_URL = 'http://mock:4000';

  beforeEach(async () => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HTTPAlquilaTuCanchaClient,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'ATC_BASE_URL') return BASE_URL;
              if (key === 'REDIS_HOST') return 'redis';
              if (key === 'REDIS_PORT') return 6379;
              return null;
            }),
          },
        },
        {
          provide: 'IORedis',
          useValue: redisMock,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: redisMock,
        },
      ],
    }).compile();

    client = module.get<HTTPAlquilaTuCanchaClient>(HTTPAlquilaTuCanchaClient);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
  });

  describe('getClubs', () => {
    it('should return a list of clubs', async () => {
      const placeId = 'somePlaceId';
      const mockResponse: AxiosResponse<Club[]> = {
        data: [{ id: 1, name: 'Club 1', location: 'Location 1' }],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
        config: {} as any,
        request: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await client.getClubs(placeId);
      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        '/clubs', // Ajustado para coincidir con la implementación
        expect.objectContaining({
          baseURL: BASE_URL,
          params: { placeId },
          headers: expect.any(AxiosHeaders), // Validar que sea instancia de AxiosHeaders
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
      const mockResponse: AxiosResponse<Court[]> = {
        data: [{ id: 1, type: 'Grass', name: 'Court 1' }],
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
        config: {} as any,
        request: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await client.getCourts(clubId);
      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        `/clubs/${clubId}/courts`,
        expect.objectContaining({
          baseURL: BASE_URL,
          headers: expect.any(AxiosHeaders),
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
      const date = new Date('2023-12-29T00:00:00Z');
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const mockResponse: AxiosResponse<Slot[]> = {
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
        config: {} as any,
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
          headers: expect.any(AxiosHeaders),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const clubId = 1;
      const courtId = 1;
      const date = new Date('2023-12-29T00:00:00Z');
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      const result = await client.getAvailableSlots(clubId, courtId, date);
      expect(result).toEqual([]);
    });
  });
});
