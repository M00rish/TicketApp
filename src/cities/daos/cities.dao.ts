import debug from 'debug';
import shortid from 'shortid';
import { CreateCityDto } from '../dtos/create.city.dto';
import { PatchCityDto } from '../dtos/patch.city.dto';
import { CommonService } from '../../common/service/common.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:city-dao');

class CitiesDao {
  constructor(private commonService: CommonService) {
    log('Created new instance of cityesDao');
    this.City = this.commonService.getOrCreateModel('City', this.citySchema);
  }

  /**
   * Creates a new city.
   * @param {CreateCityDto} City - The city data to be created.
   * @returns {Promise<string>} The ID of the created city.
   */
  async create(City: CreateCityDto) {
    const cityId = shortid.generate();
    const city = new this.City({
      _id: cityId,
      ...City,
    });

    await city.save();
    return cityId;
  }

  /**
   * Retrieves a city by its ID.
   * @param cityId - The ID of the city to retrieve.
   * @returns A promise that resolves to the city object.
   */
  async getById(cityId: string) {
    return await this.City.findById(cityId).exec();
  }

  /**
   * Retrieves a list of cities.
   * @returns {Promise<City[]>} A promise that resolves to an array of cities.
   */
  async list() {
    return await this.City.find().exec();
  }

  /**
   * Updates a city by its ID.
   * @param {string} cityId - The ID of the city to update.
   * @param {PatchCityDto} cityFields - The fields to update in the city.
   * @returns {Promise<City>} - The updated city.
   */
  async updateById(cityId: string, cityFields: PatchCityDto) {
    const updatedCity = await this.City.findByIdAndUpdate(
      cityId,
      { $set: cityFields },
      { new: true }
    ).exec();

    return updatedCity;
  }

  /**
   * Deletes a city by its ID.
   * @param {string} cityId - The ID of the city to delete.
   * @returns {Promise<any>} A promise that resolves to the result of the delete operation.
   */
  async deleteById(cityId: string) {
    return await this.City.deleteOne({ _id: cityId }).exec();
  }

  /**
   * Retrieves a city by its name.
   * @param name - The name of the city to retrieve.
   * @returns A Promise that resolves to the city object if found, or null if not found.
   */
  async getCityByName(name: string) {
    return await this.City.findOne({ cityName: name }).exec();
  }

  schema = this.commonService.getMongoose().Schema;

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
