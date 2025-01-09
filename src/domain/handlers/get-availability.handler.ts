import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query';
import {
  ALQUILA_TU_CANCHA_CLIENT,
  AlquilaTuCanchaClient,
} from '../ports/aquila-tu-cancha.client';
import { RedisService } from '../../infrastructure/services/redis.service';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly alquilaTuCanchaClient: AlquilaTuCanchaClient,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Maneja la consulta de disponibilidad.
   */
   async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const cacheKey = `availability:${query.placeId}:${query.date}`;
  
    try {
      // Intentar obtener datos del caché
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData) as ClubWithAvailability[];
      }
  
      // Obtener datos desde la API
      const clubs = await this.alquilaTuCanchaClient.getClubs(query.placeId);
      const clubs_with_availability = await Promise.all(
        clubs.map(async (club) => {
          const courts = await this.alquilaTuCanchaClient.getCourts(club.id);
          const courts_with_availability = await Promise.all(
            courts.map(async (court) => {
              const slots = await this.alquilaTuCanchaClient.getAvailableSlots(
                club.id,
                court.id,
                query.date,
              );
              return {
                ...court,
                available: slots,
              };
            }),
          );
          return {
            ...club,
            courts: courts_with_availability,
          };
        }),
      );
  
      // Guardar en el caché y retornar los datos
      await this.redisService.set(cacheKey, JSON.stringify(clubs_with_availability));
      return clubs_with_availability;
    } catch (error) {
      // Manejo de errores si falla alguna operación de la API
      // console.error('Error fetching availability data:', error);
      throw new Error('Failed to fetch availability data');
    }
  }
  
  
}
