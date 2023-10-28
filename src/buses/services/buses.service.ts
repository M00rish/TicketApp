import { CRUD } from '../../common/interfaces/crud.interface';
import busesDao from '../daos/buses.dao';
import { PatchBusDto } from '../dtos/patch.bus.dto';

class BusService implements CRUD {
  async create(resource: any) {
    return await busesDao.addBus(resource);
  }

  async deleteById(resourceId: string) {
    return await busesDao.removeBusById(resourceId);
  }

  async list(limit: number, page: number) {
    return await busesDao.getBuses();
  }

  async updateById(busId: string, resource: PatchBusDto) {
    return await busesDao.updateBusById(busId, resource);
  }

  async getById(resourceId: string) {
    return await busesDao.getBusById(resourceId);
  }
}

export default new BusService();
