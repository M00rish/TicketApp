import debug from 'debug';
import shortid from 'shortid';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import mongooseService from '../../common/service/mongoose.service';
import { CreateCityDto } from '../dtos/create.city.dto';
import { PatchcityDto } from '../dtos/patch.city.dto';

const log: debug.IDebugger = debug('app:city-dao');

class citiesDao {
  constructor() {
    log('created new instance of cityesDao');
  }

  async addcity(cityFields: CreateCityDto) {
    try {
      const cityId = shortid.generate();
      const city = new this.city({
        _id: cityId,
        ...cityFields,
      });

      await city.save();
      return cityId;
    } catch (error: any) {
      throw error;
    }
  }

  async getcityById(cityId: string) {
    try {
      const city = await this.city.findById(cityId).exec();
      if (!city)
        throw new AppError(
          true,
          'getcityById_Error',
          HttpStatusCode.NotFound,
          'city not found'
        );
      return city;
    } catch (error) {
      throw error;
    }
  }

  async getcityes() {
    try {
      const cityes = await this.city.find().exec();
      if (!cityes)
        throw new AppError(
          true,
          'getcityes_Error',
          HttpStatusCode.NotFound,
          'No cityes found'
        );
      return cityes;
    } catch (error) {
      throw error;
    }
  }

  async updatecityById(cityId: string, cityFields: PatchcityDto) {
    try {
      const city = await this.city.findById(cityId).exec();
      if (!city)
        throw new AppError(
          true,
          'updatecityById_Error',
          HttpStatusCode.NotFound,
          'city not found'
        );
      city.set(cityFields);
      await city.save();
      return cityId;
    } catch (error) {
      throw error;
    }
  }

  async removecityById(cityId: string) {
    try {
      const city = await this.city.findById(cityId).exec();
      if (!city)
        throw new AppError(
          true,
          'removecityById_Error',
          HttpStatusCode.NotFound,
          'city not found'
        );
      await city.remove();
      return cityId;
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
      location: String,
    },
    { id: false, timestamps: true }
  );

  city = mongooseService.getMongoose().model('City', this.citySchema);
}

export default new citiesDao();
