import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import { CitiesDao } from '../daos/cities.dao';
import { PatchCityDto } from '../dtos/patch.city.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { CreateCityDto } from '../dtos/create.city.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:cities-service');

class CitiesService implements CRUD {
  constructor(private citiesDao: CitiesDao) {
    log('Created new instance of citiesService');
  }

  /**
   * Creates a new city.
   * @param {CreateCityDto} City - The city data to be created.
   * @returns {Promise<number>} The ID of the created city.
   * @throws {Error} If an error occurs while creating the city.
   */
  async create(City: CreateCityDto) {
    try {
      const cityId = await this.citiesDao.create(City);
      return cityId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a city by its ID.
   * @param cityId - The ID of the city to retrieve.
   * @returns A Promise that resolves to the retrieved city.
   * @throws {AppError} If the city is not found.
   */
  async getById(cityId: string) {
    try {
      const city = await this.citiesDao.getById(cityId);
      if (!city)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'City not found!'
        );
      return city;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a list of cities.
   *
   * @param limit - The maximum number of cities to retrieve.
   * @param page - The page number of the results.
   * @returns A promise that resolves to an array of cities.
   * @throws If an error occurs while retrieving the cities.
   */
  async list(limit: number, page: number) {
    try {
      const cities = await this.citiesDao.list();
      return cities;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a city by its ID.
   * @param {string} cityId - The ID of the city to update.
   * @param {PatchCityDto} resource - The data to update the city with.
   * @returns {Promise<string>} The ID of the updated city.
   * @throws {AppError} If the city is not found.
   */
  async updateById(cityId: string, resource: PatchCityDto) {
    try {
      const updatedCity = await this.citiesDao.updateById(cityId, resource);
      if (!updatedCity)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'City not found'
        );
      return cityId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a city by its resource ID.
   * @param resourceId - The ID of the city resource to delete.
   * @throws {AppError} If the city is not found.
   */
  async deleteById(resourceId: string) {
    try {
      const deletedCity = await this.citiesDao.deleteById(resourceId);
      if (deletedCity.deletedCount === 0)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'City not found'
        );
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a city by its name.
   * @param cityName - The name of the city to retrieve.
   * @returns A Promise that resolves to the city object if found, or throws an error if not found.
   */
  async getCityByName(cityName: string) {
    try {
      const city = await this.citiesDao.getCityByName(cityName);
      if (!city)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'city not found'
        );
      return city;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the departure city by checking if it exists in the cities service.
   * @param departureCityName - The name of the departure city to validate.
   * @returns A boolean indicating whether the departure city is valid or not.
   * @throws Throws an error if there is an error while validating the departure city.
   */
  public async validateDepartureCity(departureCityName: string) {
    try {
      const departureCity = await this.getCityByName(departureCityName);

      if (!departureCity) return false;

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the arrival city by checking if it exists and if it is different from the departure city.
   * @param arrivalCityName - The name of the arrival city to validate.
   * @returns A boolean indicating whether the arrival city is valid or not.
   * @throws Throws an error if there is an issue with the validation process.
   */
  public async validateArrivalCity(arrivalCityName: string) {
    try {
      const arrivalCity = await this.getCityByName(arrivalCityName);

      if (!arrivalCity) return false;

      // @ts-ignore
      if (arrivalCity.cityName === this.departureCity)
        throw new AppError(
          true,
          'validateArrivalCityError',
          HttpStatusCode.BadRequest,
          'Arrival city must be different from departure city'
        );

      return true;
    } catch (error) {
      throw error;
    }
  }
}

export { CitiesService };
