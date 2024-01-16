import debug from 'debug';
import shortid from 'shortid';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import mongooseService from '../../common/service/mongoose.service';
import { CreateCityDto } from '../dtos/create.city.dto';
import { PatchCityDto } from '../dtos/patch.city.dto';
import commonService, {
  CommonService,
} from '../../common/service/common.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:city-dao');

class CitiesDao {
  constructor(private commonService: CommonService) {
    log('Created new instance of cityesDao');

    this.City = this.commonService.getOrCreateModel('City', this.citySchema);
  }

  /**
   * Adds a new city to the database.
   * @param cityFields - The fields of the city to be added.
   * @returns The ID of the newly added city.
   * @throws Throws an error if there is an issue adding the city.
   */
  async addCity(cityFields: CreateCityDto) {
    try {
      const cityId = shortid.generate();
      const city = new this.City({
        _id: cityId,
        ...cityFields,
      });

      await city.save();
      return cityId;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a city by its ID.
   * @param cityId - The ID of the city to retrieve.
   * @returns The city object if found, otherwise throws an error.
   */
  async getCityById(cityId: string) {
    try {
      const city = await this.City.findById(cityId).exec();

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
   * @returns {Promise<City[]>} A promise that resolves to an array of cities.
   * @throws {AppError} If no cities are found.
   */
  async listCities() {
    try {
      const cities = await this.City.find().exec();
      if (!cities)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'No cities found'
        );
      return cities;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a city by its ID.
   * @param {string} cityId - The ID of the city to update.
   * @param {PatchCityDto} cityFields - The fields to update in the city.
   * @returns {Promise<string>} The ID of the updated city.
   * @throws {AppError} If the city is not found.
   */
  async updateCityById(cityId: string, cityFields: PatchCityDto) {
    try {
      const updatedCity = await this.City.findByIdAndUpdate(
        cityId,
        { $set: cityFields },
        { new: true }
      ).exec();

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
   * Removes a city by its ID.
   * @param {string} cityId - The ID of the city to be removed.
   * @returns {Promise<void>} - A promise that resolves when the city is successfully removed.
   * @throws {AppError} - If the city is not found.
   */
  async removeCityById(cityId: string) {
    try {
      const deletedCity = await this.City.deleteOne({ _id: cityId }).exec();
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
   * @param name - The name of the city.
   * @returns The city object if found, otherwise throws an error.
   */
  async getCityByName(name: string) {
    try {
      const City = await this.City.findOne({ cityName: name }).exec();

      if (!City)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'city not found'
        );

      return City;
    } catch (error) {
      throw error;
    }
  }

  schema = mongooseService.getMongoose().Schema;

  citySchema = new this.schema(
    {
      _id: this.schema.Types.String,
      cityName: {
        type: String,
        unique: true,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    { id: false, timestamps: true }
  );

  City = this.commonService.getOrCreateModel('City', this.citySchema);
}

export { CitiesDao };
export default new CitiesDao(commonService);
