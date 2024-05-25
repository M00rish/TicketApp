import debug from 'debug';
import getDecorators from 'inversify-inject-decorators';

import { TicketsService } from '../../tickets/services/tickets.service';
import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { TripsDao } from '../daos/trips.dao';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import { injectable, inject, LazyServiceIdentifer } from 'inversify';
import { TYPES } from '../../ioc/types';
import { ReviewsService } from '../../reviews/services/reviews.service';
import { SchedulerService } from '../../common/service/scheduler.service';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';

const log: debug.IDebugger = debug('app:trips-service');

class TripsService implements CRUD {
  /**
   * Creates a new instance of the TripsService class.
   * @param tripsDao - The trips data access object.
   */
  //@ts-ignore
  constructor(
    private tripsDao: TripsDao,
    private reviewsService: ReviewsService,
    private schedulerService: SchedulerService,
    private ticketsService: TicketsService
  ) {
    this.tripsDao = tripsDao;
    log('Created new instance of TripsService');
  }

  /**
   * Retrieves a list of trips.
   *
   * @param limit - The maximum number of trips to retrieve.
   * @param page - The page number of the trips to retrieve.
   * @returns A Promise that resolves to an array of trips.
   */
  public async list(limit: number, page: number) {
    try {
      const trips = await this.tripsDao.list(limit, page);
      return trips;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Creates a new trip.
   *
   * @param tripDto - The trip data transfer object.
   * @returns The ID of the created trip.
   */
  public async create(tripDto: CreateTripDto) {
    const { arrivalTime, departureTime } = tripDto;
    if (arrivalTime || departureTime)
      this.validateTripTimings(arrivalTime, departureTime);

    const trip = await this.tripsDao.create(tripDto);
    await this.schedulerService.scheduleStatusUpdate(
      trip._id,
      trip.arrivalTime
    );

    return trip._id;
  }

  /**
   * Retrieves a trip by its ID.
   * @param id - The ID of the trip to retrieve.
   * @returns A Promise that resolves to the trip object if found, or undefined if not found.
   */
  public async getById(id: string) {
    try {
      const trip = await this.tripsDao.getById(id);
      if (!trip) {
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          `Trip not found`
        );
      }
      return trip;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Updates a trip by its ID.
   * @param {string} tripId - The ID of the trip to update.
   * @param {PatchTripDto} tripDto - The data to update the trip with.
   * @returns {Promise<string>} The ID of the updated trip.
   * @throws {AppError} If the trip is not found or has already been completed.
   * @throws {AppError} If there is an internal server error while updating the trip.
   */
  public async updateById(tripId: string, tripDto: PatchTripDto) {
    const trip = await this.getById(tripId);
    if (!trip)
      throw new AppError(
        true,
        'RessourceNotFoundError',
        HttpStatusCode.NotFound,
        `Trip not found`
      );
    if (trip.status === 'completed')
      throw new AppError(
        true,
        'TripCompletedError',
        HttpStatusCode.BadRequest,
        'Trip has been completed already'
      );

    const { arrivalTime, departureTime } = tripDto;
    if (arrivalTime || departureTime)
      this.validateTripTimings(arrivalTime, departureTime);

    const updatedTrip = await this.tripsDao.updateById(tripId, tripDto);

    if (!updatedTrip)
      throw new AppError(
        false,
        'Internal Server Error',
        HttpStatusCode.InternalServerError,
        'Failed to update trip'
      );

    if (trip.departureTime !== updatedTrip.departureTime)
      this.schedulerService.updateScheduledTime(
        updatedTrip._id,
        updatedTrip.arrivalTime
      );

    return tripId;
  }

  /**
   * Deletes a trip by its ID.
   * @param {string} tripId - The ID of the trip to delete.
   * @returns {Promise<void>} - A promise that resolves when the trip is deleted.
   */
  public async deleteById(tripId: string) {
    try {
      const deletedTrip = await this.tripsDao.deleteById(tripId);
      if (deletedTrip.deletedCount === 0)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );
      await this.ticketsService.deleteById(tripId);
      await this.schedulerService.cancelScheduledTime(tripId);
    } catch (err) {
      console.log(err);
    }
  }

  public async deleteAllTrips() {
    try {
      await this.tripsDao.deleteAllTrips();
      await this.ticketsService.deleteAllTickets();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resets the booked seats for all trips.
   * @returns {Promise<void>} A promise that resolves when the booked seats are reset.
   */
  public async resetBookedSeatsForAllTrips() {
    try {
      await this.tripsDao.resetBookedSeatsForAllTrips();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Updates the number of booked seats for a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber -  The seat number to be updated.
   * @returns A promise that resolves to the updated number of booked seats.
   */
  public async updateBookedSeats(tripId: string, seatNumber: number) {
    try {
      const trip = await this.getById(tripId);
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      await this.tripsDao.updateBookedSeats(tripId, seatNumber);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Removes the specified number of booked seats from a trip.
   * @param tripId - The ID of the trip.
   * @param seats -  The seat number to remove.
   * @returns A promise that resolves to the result of removing the booked seats.
   */
  public async removeBookedSeat(tripId: string, seatNumber: number) {
    try {
      const trip = await this.getById(tripId);
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      await this.tripsDao.removeBookedSeat(tripId, seatNumber);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Updates the status of a trip.
   * @param tripId - The ID of the trip to update.
   * @returns A promise that resolves to the updated trip status.
   */
  public async updateTripStatus(tripId: string) {
    try {
      const trip = await this.getById(tripId);
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      await this.tripsDao.updateTripStatus(tripId, trip.status);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Updates the rating of a trip based on the reviews associated with it.
   * @param tripId - The ID of the trip to update the rating for.
   * @throws Throws an error if there is an issue updating the trip rating.
   */
  async updateTripRating(tripId: string) {
    try {
      const reviews = await this.reviewsService.getReviewsByTripId(tripId);
      await this.tripsDao.updateTripRating(tripId, reviews);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Validates the trip timings.
   *
   * @param arrivalTime - The arrival time of the trip.
   * @param departureTime - The departure time of the trip.
   * @throws {AppError} - If the trip timings are invalid.
   */
  validateTripTimings(
    arrivalTime: Date | undefined,
    departureTime: Date | undefined
  ) {
    if (!arrivalTime || !departureTime) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Both arrival time and departure time must be provided'
      );
    }

    const parsedArrivalTime = new Date(arrivalTime);
    const parsedDepartureTime = new Date(departureTime);
    const now = new Date();

    if (parsedArrivalTime.getTime() < now.getTime()) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Arrival time must be in the future'
      );
    }

    if (parsedDepartureTime.getTime() < now.getTime()) {
      throw new AppError(
        true,
        'validateDepartureTimeError',
        HttpStatusCode.BadRequest,
        'Departure time must be in the future'
      );
    }

    if (parsedArrivalTime.getTime() < parsedDepartureTime.getTime()) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Arrival time must be greater than departure time'
      );
    }

    const difference =
      parsedArrivalTime.getTime() - parsedDepartureTime.getTime();
    const hours = difference / 1000 / 60 / 60;

    if (hours > 48) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'The difference between arrival time and departure time must be at max 48 hours'
      );
    }
  }
}

export { TripsService };
