import { CRUD } from '../../common/interfaces/crud.interface';
import citiesDao from '../daos/cities.dao';
import { PatchcityDto } from '../dtos/patch.city.dto';

class citiesService implements CRUD {
  async create(resource: any) {
    return await citiesDao.addcity(resource);
  }

  async deleteById(resourceId: string) {
    return await citiesDao.removecityById(resourceId);
  }

  async list(limit: number, page: number) {
    return await citiesDao.getcityes();
  }

  async updateById(cityId: string, resource: PatchcityDto) {
    return await citiesDao.updatecityById(cityId, resource);
  }

  async getById(resourceId: string) {
    return await citiesDao.getcityById(resourceId);
  }
}

export default new citiesService();
