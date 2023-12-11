import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import busesDao, { BusesDao } from '../daos/buses.dao';
import { PatchBusDto } from '../dtos/patch.bus.dto';

const log: debug.IDebugger = debug('app:buses-service');

class BusesService implements CRUD {
  constructor(private busesDao: BusesDao) {
    log('created new instance of BusesService');
  }

  /**
   * Creates a new bus.
   * @param resource - The resource containing the details of the bus to be created.
   * @returns A promise that resolves to the created bus.
   */
  async create(resource: any) {
    return await this.busesDao.addBus(resource);
  }

  /**
   * Deletes a bus by its ID.
   * @param resourceId The ID of the bus to delete.
   * @returns A promise that resolves to the result of the deletion operation.
   */
  async deleteById(resourceId: string) {
    return await this.busesDao.removeBusById(resourceId);
  }

  /**
   * Retrieves a list of buses.
   *
   * @param limit - The maximum number of buses to retrieve.
   * @param page - The page number of the results.
   * @returns A promise that resolves to the list of buses.
   */
  async list(limit: number, page: number) {
    return await this.busesDao.getBuses();
  }

  /**
   * Updates a bus by its ID.
   * @param {string} busId - The ID of the bus to update.
   * @param {PatchBusDto} resource - The data to update the bus with.
   * @returns {Promise<void>} - A promise that resolves when the bus is updated.
   */
  async updateById(busId: string, resource: PatchBusDto) {
    return await this.busesDao.updateBusById(busId, resource);
  }

  /**
   * Retrieves a bus by its ID.
   * @param resourceId - The ID of the bus to retrieve.
   * @returns A Promise that resolves to the bus object.
   */
  async getById(resourceId: string) {
    return await this.busesDao.getBusById(resourceId);
  }
}

export default new BusesService(busesDao);
export { BusesService };
