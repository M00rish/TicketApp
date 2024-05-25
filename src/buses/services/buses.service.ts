import debug from 'debug';
import { CRUD } from '../../common/interfaces/crud.interface';
import { BusesDao } from '../daos/buses.dao';
import { PatchBusDto } from '../dtos/patch.bus.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { CreateBusDto } from '../dtos/create.bus.dto';

const log: debug.IDebugger = debug('app:buses-service');

class BusesService implements CRUD {
  constructor(private busesDao: BusesDao) {
    log('Created new instance of BusesService');
  }

  /**
   * Creates a new bus resource.
   *
   * @param resource - The data for creating the bus.
   * @returns A promise that resolves to the ID of the created bus.
   * @throws If an error occurs while creating the bus.
   */
  async create(resource: CreateBusDto): Promise<string> {
    try {
      const busId = await this.busesDao.create(resource);
      return busId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a bus by its ID.
   * @param resourceId - The ID of the bus to retrieve.
   * @returns A Promise that resolves to the retrieved bus.
   * @throws {AppError} If the bus is not found.
   */
  async getById(resourceId: string): Promise<CreateBusDto> {
    try {
      const bus = await this.busesDao.getById(resourceId);
      if (!bus)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
      return bus;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a list of buses.
   *
   * @param limit - The maximum number of buses to retrieve.
   * @param page - The page number of the results.
   * @returns A promise that resolves to an array of CreateBusDto objects representing the buses.
   * @throws If an error occurs while retrieving the list of buses.
   */
  async list(limit: number, page: number): Promise<CreateBusDto[]> {
    try {
      const buses = await this.busesDao.list(limit, page);
      return buses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a bus by its ID.
   * @param {string} busId - The ID of the bus to update.
   * @param {PatchBusDto} resource - The updated bus data.
   * @returns {Promise<string>} - The ID of the updated bus.
   * @throws {AppError} - If the bus is not found.
   */
  async updateById(busId: string, resource: PatchBusDto): Promise<string> {
    try {
      const bus = await this.getById(busId);
      if (!bus)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
      await this.busesDao.updateById(busId, resource);
      return busId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a bus by its ID.
   *
   * @param busId - The ID of the bus to delete.
   * @throws {AppError} If the bus is not found.
   */
  async deleteById(busId: string) {
    try {
      const bus = await this.getById(busId);
      if (!bus)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Bus not found'
        );

      await this.busesDao.deleteById(busId);
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates if a bus with the given ID exists.
   *
   * @param busId - The ID of the bus to validate.
   * @returns A Promise that resolves to a boolean indicating if the bus exists.
   * @throws If an error occurs while validating the bus.
   */
  async validateBusExists(busId: string) {
    try {
      return await this.busesDao.validateBusExists(busId);
    } catch (error) {
      throw error;
    }
  }
}

export { BusesService };
