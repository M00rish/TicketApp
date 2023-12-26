import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import { CitiesDao } from '../daos/cities.dao';
import { PatchCityDto } from '../dtos/patch.city.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:cities-service');

@injectable()
class CitiesService implements CRUD {
  constructor(@inject(TYPES.CitiesDao) private citiesDao: CitiesDao) {
    log('Created new instance of citiesService');
  }

  /**
   * Creates a new city.
   * @param resource - The resource containing the city data.
   * @returns A promise that resolves to the created city.
   */
  async create(resource: any) {
    return await this.citiesDao.addCity(resource);
  }

  /**
   * Deletes a city by its ID.
   * @param resourceId The ID of the city to delete.
   * @returns A promise that resolves when the city is deleted.
   */
  async deleteById(resourceId: string) {
    return await this.citiesDao.removeCityById(resourceId);
  }

  /**
   * Retrieves a list of cities.
   *
   * @param limit - The maximum number of cities to retrieve.
   * @param page - The page number of the results.
   * @returns A promise that resolves to the list of cities.
   */
  async list(limit: number, page: number) {
    return await this.citiesDao.listCities();
  }

  /**
   * Updates a city by its ID.
   * @param cityId - The ID of the city to update.
   * @param resource - The data to update the city with.
   * @returns A promise that resolves to the updated city.
   */
  async updateById(cityId: string, resource: PatchCityDto) {
    return await this.citiesDao.updateCityById(cityId, resource);
  }

  /**
   * Retrieves a city by its ID.
   * @param resourceId - The ID of the city to retrieve.
   * @returns A Promise that resolves to the city object.
   */
  async getById(resourceId: string) {
    return await this.citiesDao.getCityById(resourceId);
  }

  /**
   * Retrieves a city by its name.
   * @param cityName - The name of the city.
   * @returns A Promise that resolves to the city object.
   */
  async getCityByName(cityName: string) {
    return await this.citiesDao.getCityByName(cityName);
  }
}

export { CitiesService };
