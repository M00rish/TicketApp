import debug from 'debug';
import getDecorators from 'inversify-inject-decorators';

import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { TripsDao } from '../daos/trips.dao';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import { injectable, inject, LazyServiceIdentifer } from 'inversify';
import { TYPES } from '../../ioc/types';
import { container } from '../../ioc/inversify.config';

const log: debug.IDebugger = debug('app:trips-service');

const { lazyInject } = getDecorators(container);

@injectable()
class TripsService implements CRUD {
  private tripsDao: TripsDao;

  /**
   * Creates a new instance of the TripsService class.
   * @param tripsDao - The trips data access object.
   */
  //@ts-ignore
  constructor(
    @inject(new LazyServiceIdentifer(() => TYPES.TripsDao)) tripsDao: TripsDao
  ) {
    this.tripsDao = tripsDao;
    log('Created new instance of TripsService');
  }

  /**
   * Retrieves a list of trips.
   * @param limit - The maximum number of trips to retrieve.
   * @param page - The page number of the trips to retrieve.
   * @returns A promise that resolves to the list of trips.
   */
  public async list(limit: number, page: number) {
    return await this.tripsDao.listTrips(limit, page);
  }

  /**
   * Creates a new trip.
   * @param resource - The data for the new trip.
   * @returns A promise that resolves to the created trip.
   */
  public async create(resource: CreateTripDto) {
    return await this.tripsDao.createTrip(resource);
  }

  /**
   * Deletes a trip by its ID.
   * @param id - The ID of the trip to delete.
   * @returns A promise that resolves when the trip is deleted.
   */
  public async deleteById(id: string) {
    return await this.tripsDao.deleteById(id);
  }

  /**
   * Updates a trip by its ID.
   * @param id - The ID of the trip to update.
   * @param resource - The data to update the trip with.
   * @returns A promise that resolves to the updated trip.
   */
  public async updateById(id: string, resource: PatchTripDto) {
    return await this.tripsDao.updateById(id, resource);
  }

  /**
   * Retrieves a trip by its ID.
   * @param id - The ID of the trip to retrieve.
   * @returns A promise that resolves to the trip with the specified ID.
   */
  public async getById(id: string) {
    return await this.tripsDao.getById(id);
  }

  /**
   * Deletes all trips.
   * @returns {Promise<void>} A promise that resolves when all trips are deleted.
   */
  public async deleteAll() {
    return await this.tripsDao.deleteAllTrips();
  }

  /**
   * Updates the number of booked seats for a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber -  The seat number to be updated.
   * @returns A promise that resolves to the updated number of booked seats.
   */
  public async updateBookedSeats(tripId: string, seatNumber: number) {
    return await this.tripsDao.updateBookedSeats(tripId, seatNumber);
  }

  /**
   * Removes the specified number of booked seats from a trip.
   * @param tripId - The ID of the trip.
   * @param seats -  The seat number to remove.
   * @returns A promise that resolves to the result of removing the booked seats.
   */
  public async removeBookedSeats(tripId: string, seatNumber: number) {
    return await this.tripsDao.removeBookedSeat(tripId, seatNumber);
  }

  /**
   * Resets the booked seats for all trips.
   * @returns {Promise<void>} A promise that resolves when the booked seats are reset.
   */
  public async resetBookedSeatsForAllTrips() {
    return await this.tripsDao.resetBookedSeatsForAllTrips();
  }

  /**
   * Updates the status of a trip.
   * @param tripId - The ID of the trip to update.
   * @returns A promise that resolves to the updated trip status.
   */
  public async updateTripStatus(tripId: string) {
    return await this.tripsDao.updateTripStatus(tripId);
  }
}

export { TripsService };
